"""
Admin API endpoints for user management, analytics, and system monitoring
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from functools import wraps
import time

# Load environment variables
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / '.env')

logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.error("Supabase credentials not found in environment variables")
    raise RuntimeError("Supabase credentials not configured")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Helper function to check if a user is suspended
def check_user_suspension(user_id: str) -> bool:
    """
    Check if a user is currently suspended.
    Returns True if suspended, False otherwise.
    """
    try:
        users = supabase.auth.admin.list_users()
        for user in users:
            if user.id == user_id:
                # Check banned_until field
                banned_until = getattr(user, 'banned_until', None)
                if banned_until:
                    try:
                        banned_date = datetime.fromisoformat(banned_until.replace('Z', '+00:00'))
                        if banned_date > datetime.utcnow().replace(tzinfo=banned_date.tzinfo):
                            return True
                    except:
                        pass
                
                # Check user_metadata
                if user.user_metadata.get("is_suspended", False):
                    return True
                
                return False
        
        return False
    except Exception as e:
        logger.error(f"Error checking user suspension: {str(e)}")
        return False

# Create router
admin_router = APIRouter(prefix="/api/admin", tags=["admin"])

# Simple in-memory cache with TTL
_cache = {}
_cache_timestamps = {}

def cache_with_ttl(ttl_seconds: int = 60):
    """
    Simple caching decorator with time-to-live.
    Caches function results for specified seconds.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and args
            cache_key = f"{func.__name__}_{str(args)}_{str(kwargs)}"
            
            # Check if cached and not expired
            if cache_key in _cache:
                timestamp = _cache_timestamps.get(cache_key, 0)
                if time.time() - timestamp < ttl_seconds:
                    logger.info(f"Cache HIT for {func.__name__}")
                    return _cache[cache_key]
                else:
                    logger.info(f"Cache EXPIRED for {func.__name__}")
            
            # Call function and cache result
            logger.info(f"Cache MISS for {func.__name__}, fetching fresh data")
            result = await func(*args, **kwargs)
            _cache[cache_key] = result
            _cache_timestamps[cache_key] = time.time()
            return result
        return wrapper
    return decorator

# Models
class UserStatusUpdate(BaseModel):
    suspended: bool

class AdminRoleUpdate(BaseModel):
    is_admin: bool
    admin_level: Optional[str] = "regular"  # "super" or "regular"

# Helper function to verify admin access
async def verify_admin(authorization: Optional[str] = Header(None)):
    """
    Verify that the request is from an admin user.
    In production, implement proper JWT validation and admin role checking.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Extract token from Bearer header
        token = authorization.replace("Bearer ", "")
        
        # Verify user with Supabase using service role key
        # This bypasses RLS and session validation, allowing admins to manage suspended users
        try:
            user = supabase.auth.get_user(token)
        except Exception as auth_error:
            logger.error(f"Token verification failed: {str(auth_error)}")
            raise HTTPException(status_code=401, detail="Invalid or expired token. Please log out and log back in.")
        
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if user is admin (from user_metadata or app_metadata)
        user_data = user.user
        is_admin = (
            user_data.user_metadata.get("is_admin", False) or
            user_data.app_metadata.get("is_admin", False)
        )
        
        if not is_admin:
            logger.warning(f"Non-admin user {user_data.id} attempted to access admin endpoint")
            raise HTTPException(status_code=403, detail="Admin access required")
        
        logger.info(f"Admin access granted for user {user_data.id} ({user_data.email})")
        return user_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin verification error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=401, detail="Authentication failed")

# Helper function to verify super admin access
async def verify_super_admin(authorization: Optional[str] = Header(None)):
    """
    Verify that the request is from a super admin user.
    """
    user_data = await verify_admin(authorization)
    
    # Check if user is super admin
    admin_level = user_data.user_metadata.get("admin_level", "regular")
    
    if admin_level != "super":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    return user_data


# Helper function to fetch dashboard stats (cached for performance)
@cache_with_ttl(ttl_seconds=30)  # Cache for 30 seconds
async def fetch_dashboard_stats_data():
    """
    Internal function to fetch dashboard statistics.
    Cached to improve performance.
    """
    logger.info("=== Starting dashboard stats fetch ===")
    
    # Get total users
    total_users = 0
    users_data = []
    try:
        logger.info("Fetching users from Supabase...")
        users_list_response = supabase.auth.admin.list_users()
        logger.info(f"Users response type: {type(users_list_response)}")
        
        # Handle different response structures
        if hasattr(users_list_response, 'users'):
            users_data = users_list_response.users
        elif isinstance(users_list_response, list):
            users_data = users_list_response
        else:
            users_data = []
        total_users = len(users_data)
        logger.info(f"Total users: {total_users}")
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}", exc_info=True)
        users_data = []
        total_users = 0
    
    # Get active users (signed in last 30 days)
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).replace(microsecond=0).isoformat() + 'Z'
    active_users = 0
    if users_data:
        for user in users_data:
            try:
                last_sign_in = getattr(user, 'last_sign_in_at', None)
                if last_sign_in and str(last_sign_in) >= thirty_days_ago:
                    active_users += 1
            except:
                continue
    
    # Get NCP statistics
    logger.info("Fetching NCP statistics...")
    try:
        ncps_result = supabase.table("ncps").select("id,created_at", count="exact").execute()
        total_ncps = ncps_result.count if ncps_result else 0
        logger.info(f"Total NCPs: {total_ncps}")
    except Exception as e:
        logger.error(f"Error fetching total NCPs: {str(e)}", exc_info=True)
        total_ncps = 0
    
    # NCPs this month
    try:
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
        ncps_month_result = supabase.table("ncps").select("id", count="exact").gte("created_at", start_of_month).execute()
        ncps_this_month = ncps_month_result.count if ncps_month_result else 0
    except Exception as e:
        logger.error(f"Error fetching NCPs this month: {str(e)}")
        ncps_this_month = 0
    
    # NCPs today
    try:
        start_of_today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
        ncps_today_result = supabase.table("ncps").select("id", count="exact").gte("created_at", start_of_today).execute()
        ncps_today = ncps_today_result.count if ncps_today_result else 0
    except Exception as e:
        logger.error(f"Error fetching NCPs today: {str(e)}")
        ncps_today = 0
    
    # NCPs yesterday
    try:
        start_of_yesterday = (datetime.utcnow() - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
        ncps_yesterday_result = supabase.table("ncps").select("id", count="exact").gte("created_at", start_of_yesterday).lt("created_at", start_of_today).execute()
        ncps_yesterday = ncps_yesterday_result.count if ncps_yesterday_result else 0
    except Exception as e:
        logger.error(f"Error fetching NCPs yesterday: {str(e)}")
        ncps_yesterday = 0
    
    # Calculate percentage change
    today_vs_yesterday = 0
    if ncps_yesterday > 0:
        today_vs_yesterday = round(((ncps_today - ncps_yesterday) / ncps_yesterday) * 100, 1)
    elif ncps_today > 0:
        today_vs_yesterday = 100
    
    # Get chart data (last 30 days) - OPTIMIZED: Single query instead of 30
    logger.info("Generating chart data...")
    chart_data = []
    try:
        thirty_days_ago_date = (datetime.utcnow() - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
        
        # Fetch all NCPs from last 30 days in one query
        ncps_last_30_days = supabase.table("ncps").select("created_at").gte("created_at", thirty_days_ago_date).execute()
        
        # Group by date in Python (more efficient than 30 separate queries)
        date_counts = {}
        if ncps_last_30_days.data:
            for ncp in ncps_last_30_days.data:
                try:
                    # Parse the date and extract just the day
                    created_date = datetime.fromisoformat(ncp['created_at'].replace('Z', '+00:00'))
                    date_key = created_date.strftime("%Y-%m-%d")
                    date_counts[date_key] = date_counts.get(date_key, 0) + 1
                except Exception as e:
                    continue
        
        # Build chart data for all 30 days
        for i in range(29, -1, -1):
            day = datetime.utcnow() - timedelta(days=i)
            date_key = day.strftime("%Y-%m-%d")
            count = date_counts.get(date_key, 0)
            
            chart_data.append({
                "date": day.strftime("%b %d"),
                "count": count
            })
        logger.info(f"Chart data generated: {len(chart_data)} days")
    except Exception as e:
        logger.error(f"Error generating chart data: {str(e)}", exc_info=True)
        chart_data = []
    
    # Get top diagnoses - OPTIMIZED: Limit processing to avoid loading all NCPs
    logger.info("Fetching top diagnoses...")
    top_diagnoses = []
    try:
        # Only fetch diagnosis field, and limit if there are too many NCPs
        if total_ncps > 1000:
            # For large datasets, sample recent NCPs only
            logger.info(f"Large dataset detected ({total_ncps} NCPs), sampling recent 1000 for top diagnoses")
            all_ncps = supabase.table("ncps").select("diagnosis").order("created_at", desc=True).limit(1000).execute()
        else:
            all_ncps = supabase.table("ncps").select("diagnosis").execute()
        
        diagnosis_counts = {}
        if all_ncps and all_ncps.data:
            logger.info(f"Processing {len(all_ncps.data)} NCPs for diagnosis counts")
            for ncp in all_ncps.data:
                try:
                    if ncp.get("diagnosis"):
                        diagnosis_data = ncp["diagnosis"]
                        diagnosis_text = ""
                        
                        # Handle different diagnosis formats
                        if isinstance(diagnosis_data, dict):
                            # Try common keys for diagnosis text
                            diagnosis_text = (
                                diagnosis_data.get("statement", "") or  # Current format
                                diagnosis_data.get("diagnosis", "") or 
                                diagnosis_data.get("label", "") or
                                diagnosis_data.get("title", "") or
                                diagnosis_data.get("name", "")
                            )
                        elif isinstance(diagnosis_data, str):
                            diagnosis_text = diagnosis_data
                        
                        if diagnosis_text:
                            # Extract just the diagnosis label (before "related to" or "as evidenced by")
                            # This groups similar diagnoses together
                            diagnosis_label = diagnosis_text.split(" related to ")[0].split(" as evidenced by ")[0].strip()
                            # Normalize to title case for consistent grouping
                            diagnosis_label = diagnosis_label.title()
                            diagnosis_counts[diagnosis_label] = diagnosis_counts.get(diagnosis_label, 0) + 1
                        else:
                            logger.warning(f"Could not extract diagnosis text from: {type(diagnosis_data)} - {str(diagnosis_data)[:100]}")
                except Exception as e:
                    logger.error(f"Error processing diagnosis: {str(e)}", exc_info=True)
                    continue
            
            logger.info(f"Found {len(diagnosis_counts)} unique diagnoses")
        
        # Get top 5 diagnoses
        sorted_diagnoses = sorted(diagnosis_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        sample_size = min(len(all_ncps.data) if all_ncps and all_ncps.data else 0, 1000)
        top_diagnoses = [
            {
                "name": diag[0][:50] + "..." if len(diag[0]) > 50 else diag[0],
                "count": diag[1],
                "percentage": round((diag[1] / sample_size * 100), 1) if sample_size > 0 else 0
            }
            for diag in sorted_diagnoses
        ]
    except Exception as e:
        logger.error(f"Error fetching diagnoses: {str(e)}", exc_info=True)
        top_diagnoses = []
    
    # Get recent activity
    try:
        recent_users_response = supabase.auth.admin.list_users()
        if hasattr(recent_users_response, 'users'):
            recent_users_data = recent_users_response.users[:3]
        elif isinstance(recent_users_response, list):
            recent_users_data = recent_users_response[:3]
        else:
            recent_users_data = []
    except Exception as e:
        logger.error(f"Error fetching recent users: {str(e)}")
        recent_users_data = []
        
    recent_ncps = supabase.table("ncps").select("id,created_at,user_id").order("created_at", desc=True).limit(5).execute()
    
    recent_activity = []
    
    # Add recent users
    for user in recent_users_data:
        try:
            user_email = getattr(user, 'email', 'Unknown')
            user_id = getattr(user, 'id', 'unknown')
            user_created = getattr(user, 'created_at', datetime.utcnow().isoformat())
            recent_activity.append({
                "id": f"user-{user_id}",
                "type": "user",
                "userInitials": user_email[:2].upper() if user_email else "U",
                "description": f"New user registered: {user_email}",
                "time": format_time_ago(user_created)
            })
        except Exception as e:
            logger.error(f"Error processing user: {str(e)}")
            continue
    
    # Add recent NCPs
    if recent_ncps.data:
        for ncp in recent_ncps.data[:3]:
            recent_activity.append({
                "id": f"ncp-{ncp['id']}",
                "type": "ncp",
                "userInitials": "NC",
                "description": f"New NCP generated",
                "time": format_time_ago(ncp['created_at'])
            })
    
    # Sort by time
    try:
        recent_activity.sort(key=lambda x: x["time"], reverse=False)
    except Exception as e:
        logger.error(f"Error sorting activity: {str(e)}")
    
    logger.info("=== Dashboard stats completed successfully ===")
    
    result = {
        "stats": {
            "totalUsers": total_users,
            "activeUsers": active_users,
            "totalNCPs": total_ncps,
            "ncpsThisMonth": ncps_this_month,
            "ncpsToday": ncps_today,
            "todayVsYesterday": today_vs_yesterday
        },
        "systemHealth": {
            "status": "healthy",
            "uptime": "All systems operational"
        },
        "chartData": chart_data,
        "topDiagnoses": top_diagnoses,
        "recentActivity": recent_activity[:8]
    }
    
    logger.info(f"Returning dashboard data: {len(chart_data)} chart points, {len(top_diagnoses)} diagnoses, {len(recent_activity[:8])} activities")
    return result


@admin_router.get("/dashboard-stats")
async def get_dashboard_stats(admin_user = Depends(verify_admin)):
    """
    Get dashboard statistics including user counts, NCP counts, and trends.
    Uses caching for improved performance.
    """
    try:
        return await fetch_dashboard_stats_data()
    except Exception as e:
        logger.error(f"Error in dashboard stats endpoint: {str(e)}")
        raise


# Helper function to fetch users (cached for performance)
@cache_with_ttl(ttl_seconds=30)  # Cache for 30 seconds
async def fetch_users_data():
    """
    Internal function to fetch user data.
    Cached to improve performance.
    """
    try:
        # Get all users from Supabase Auth
        auth_users = supabase.auth.admin.list_users()
        
        if not auth_users:
            return []
        
        # OPTIMIZATION: Fetch all profiles in one query
        all_profiles = {}
        try:
            profiles_result = supabase.table("profiles").select("id, first_name, last_name").execute()
            if profiles_result.data:
                all_profiles = {profile['id']: profile for profile in profiles_result.data}
        except Exception as e:
            logger.debug(f"Could not fetch profiles: {str(e)}")
        
        # OPTIMIZATION: Fetch all NCP counts in one aggregated query
        # First get all user IDs
        user_ids = [user.id for user in auth_users]
        
        # Fetch NCPs and count them grouped by user_id in Python
        # (Supabase doesn't support GROUP BY in select, so we fetch and group)
        ncp_counts = {}
        try:
            # Fetch all NCPs with just user_id field
            all_ncps = supabase.table("ncps").select("user_id").in_("user_id", user_ids).execute()
            if all_ncps.data:
                for ncp in all_ncps.data:
                    user_id = ncp['user_id']
                    ncp_counts[user_id] = ncp_counts.get(user_id, 0) + 1
        except Exception as e:
            logger.error(f"Error fetching NCP counts: {str(e)}")
        
        # Build user list
        user_list = []
        for user in auth_users:
            # Get NCP count from pre-fetched data
            ncp_count = ncp_counts.get(user.id, 0)
            
            # Get user profile from pre-fetched data
            full_name = ""
            profile = all_profiles.get(user.id)
            if profile:
                name_parts = [
                    profile.get("first_name", ""),
                    profile.get("last_name", "")
                ]
                full_name = " ".join(part for part in name_parts if part).strip()
            
            # Fallback 1: Try to get name from user_metadata (for backward compatibility)
            if not full_name:
                first_name = user.user_metadata.get("first_name", "")
                last_name = user.user_metadata.get("last_name", "")
                
                if first_name or last_name:
                    name_parts = [first_name, last_name]
                    full_name = " ".join(part for part in name_parts if part).strip()
                else:
                    full_name = (
                        user.user_metadata.get("full_name") or 
                        user.user_metadata.get("name") or 
                        ""
                    ).strip()
            
            # Fallback 2: Extract name from email
            if not full_name and user.email:
                email_name = user.email.split('@')[0]
                full_name = email_name.replace('.', ' ').replace('_', ' ').replace('-', ' ').title()
            
            # Check if user is suspended (either by metadata or banned_until)
            banned_until = getattr(user, 'banned_until', None)
            is_suspended = user.user_metadata.get("is_suspended", False)
            
            # If banned_until is set and in the future, user is suspended
            if banned_until:
                try:
                    banned_date = datetime.fromisoformat(banned_until.replace('Z', '+00:00'))
                    is_suspended = banned_date > datetime.utcnow().replace(tzinfo=banned_date.tzinfo)
                except:
                    pass
            
            user_list.append({
                "id": user.id,
                "email": user.email,
                "full_name": full_name,
                "created_at": user.created_at,
                "last_sign_in_at": user.last_sign_in_at,
                "email_confirmed_at": user.email_confirmed_at,
                "is_suspended": is_suspended,
                "is_admin": user.user_metadata.get("is_admin", False),
                "admin_level": user.user_metadata.get("admin_level", None),
                "ncp_count": ncp_count
            })
        
        return user_list
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@admin_router.get("/users")
async def get_users(admin_user = Depends(verify_admin)):
    """
    Get all users with their statistics.
    Uses caching for improved performance.
    """
    try:
        return await fetch_users_data()
    except Exception as e:
        logger.error(f"Error in get users endpoint: {str(e)}")
        raise


@admin_router.post("/clear-cache")
async def clear_cache(admin_user = Depends(verify_admin)):
    """
    Clear all admin endpoint caches.
    Useful after making changes that should be reflected immediately.
    """
    try:
        _cache.clear()
        _cache_timestamps.clear()
        logger.info("Admin cache cleared")
        return {"success": True, "message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@admin_router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status_update: UserStatusUpdate,
    admin_user = Depends(verify_admin)
):
    """
    Update user status (suspend/activate)
    """
    try:
        logger.info(f"Admin {admin_user.email} attempting to {'suspend' if status_update.suspended else 'activate'} user {user_id}")
        
        # Use Supabase's ban functionality for proper suspension
        if status_update.suspended:
            # Ban the user - this invalidates their sessions and prevents login
            # Set banned_until to far future date (100 years from now)
            banned_until = (datetime.utcnow() + timedelta(days=36500)).isoformat()
            
            supabase.auth.admin.update_user_by_id(
                user_id,
                {
                    "banned_until": banned_until,
                    "user_metadata": {"is_suspended": True}
                }
            )
            logger.info(f"User {user_id} banned until {banned_until}")
        else:
            # Unban the user by clearing the banned_until field
            supabase.auth.admin.update_user_by_id(
                user_id,
                {
                    "banned_until": None,
                    "user_metadata": {"is_suspended": False}
                }
            )
            logger.info(f"User {user_id} unbanned successfully")
        
        # Clear cache to reflect changes immediately
        _cache.clear()
        _cache_timestamps.clear()
        
        return {
            "success": True,
            "message": f"User {'suspended' if status_update.suspended else 'activated'} successfully"
        }
    except Exception as e:
        logger.error(f"Error updating user status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update user status: {str(e)}")


@admin_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin_user = Depends(verify_admin)):
    """
    Delete a user and all their data
    """
    try:
        # Get the user to check if they're a super admin
        users = supabase.auth.admin.list_users()
        target_user = None
        for user in users:
            if user.id == user_id:
                target_user = user
                break
        
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent deletion of super admins
        if target_user.user_metadata.get("admin_level") == "super":
            raise HTTPException(status_code=403, detail="Cannot delete super admin users")
        
        # Delete user's NCPs first
        supabase.table("ncps").delete().eq("user_id", user_id).execute()
        
        # Delete user from auth
        supabase.auth.admin.delete_user(user_id)
        
        # Clear cache to reflect changes immediately
        _cache.clear()
        _cache_timestamps.clear()
        
        return {
            "success": True,
            "message": "User and all associated data deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


@admin_router.patch("/users/{user_id}/admin-role")
async def update_admin_role(
    user_id: str,
    role_update: AdminRoleUpdate,
    admin_user = Depends(verify_super_admin)
):
    """
    Promote or demote a user's admin status (Super Admin only)
    """
    try:
        # Get the target user
        users = supabase.auth.admin.list_users()
        target_user = None
        for user in users:
            if user.id == user_id:
                target_user = user
                break
        
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent demotion of super admins
        if target_user.user_metadata.get("admin_level") == "super" and not role_update.is_admin:
            raise HTTPException(status_code=403, detail="Cannot demote super admin users")
        
        # Update user metadata
        metadata_update = {"is_admin": role_update.is_admin}
        
        if role_update.is_admin:
            # Only super admin can assign admin level
            metadata_update["admin_level"] = role_update.admin_level
        else:
            # Remove admin level when demoting
            metadata_update["admin_level"] = None
        
        supabase.auth.admin.update_user_by_id(
            user_id,
            {"user_metadata": metadata_update}
        )
        
        # Clear cache to reflect changes immediately
        _cache.clear()
        _cache_timestamps.clear()
        
        action = "promoted to" if role_update.is_admin else "demoted from"
        level_text = f" ({role_update.admin_level} admin)" if role_update.is_admin else ""
        
        return {
            "success": True,
            "message": f"User {action} admin{level_text} successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating admin role: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update admin role: {str(e)}")


@admin_router.get("/health")
async def get_system_health(admin_user = Depends(verify_admin)):
    """
    Get system health information
    """
    try:
        # Check backend health
        backend_status = {"status": "healthy", "message": "Backend API operational"}
        
        # Check database connectivity
        try:
            supabase.table("ncps").select("id").limit(1).execute()
            database_status = {"status": "healthy", "message": "Database connected"}
        except Exception as e:
            database_status = {"status": "error", "message": f"Database error: {str(e)}"}
        
        # Check Claude API (simplified check)
        claude_api_key = os.getenv("CLAUDE_API_KEY")
        claude_status = {
            "status": "healthy" if claude_api_key else "error",
            "message": "API key configured" if claude_api_key else "API key missing"
        }
        
        # Check Gemini API
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        gemini_status = {
            "status": "healthy" if gemini_api_key else "error",
            "message": "API key configured" if gemini_api_key else "API key missing"
        }
        
        # Get error logs (last 24 hours)
        error_logs = []
        # This would come from your logging system
        # For now, return empty array
        
        # System info
        system_info = {
            "environment": os.getenv("ENVIRONMENT", "production"),
            "version": "1.0.0",
            "uptime": "System operational",
            "lastDeployment": "N/A"
        }
        
        # Metrics (mock data - implement actual metrics collection)
        metrics = {
            "avgResponseTime": 245,
            "successRate": 98.5,
            "totalRequests": 1250
        }
        
        return {
            "health": {
                "backend": backend_status,
                "database": database_status,
                "claude": claude_status,
                "gemini": gemini_status,
                "metrics": metrics
            },
            "errorLogs": error_logs,
            "systemInfo": system_info
        }
    except Exception as e:
        logger.error(f"Error fetching system health: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch system health: {str(e)}")


@admin_router.get("/ai-provider")
async def get_ai_provider(admin_user = Depends(verify_admin)):
    """
    Get current AI provider configuration
    """
    try:
        logger.info(f"Admin {admin_user.email} requesting AI provider configuration")
        from ai_provider import ai_provider
        config = ai_provider.get_config()
        logger.info(f"Returning AI provider config: {config}")
        return {
            "success": True,
            "data": config
        }
    except Exception as e:
        logger.error(f"Error fetching AI provider config: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch AI provider config: {str(e)}")


@admin_router.post("/ai-provider/switch")
async def switch_ai_provider(
    request_data: Dict,
    admin_user = Depends(verify_admin)
):
    """
    Switch the active AI provider
    """
    try:
        logger.info(f"Admin {admin_user.email} requesting AI provider switch")
        logger.info(f"Request data: {request_data}")
        
        provider = request_data.get("provider")
        if not provider:
            logger.error("Provider not specified in request")
            raise HTTPException(status_code=400, detail="Provider is required")
        
        logger.info(f"Switching to provider: {provider}")
        from ai_provider import ai_provider
        
        logger.info(f"Current provider before switch: {ai_provider.get_current_provider()}")
        
        # Switch provider
        try:
            ai_provider.set_provider(provider)
            logger.info(f"Provider set successfully. New provider: {ai_provider.get_current_provider()}")
        except ValueError as e:
            logger.error(f"Invalid provider value: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        
        logger.info(f"Admin {admin_user.email} switched AI provider to {provider}")
        
        config = ai_provider.get_config()
        logger.info(f"Returning new config: {config}")
        
        return {
            "success": True,
            "message": f"AI provider switched to {provider}",
            "data": config
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error switching AI provider: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to switch AI provider: {str(e)}")


# Helper functions
def format_time_ago(timestamp: str) -> str:
    """Format timestamp as 'X time ago'"""
    try:
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        now = datetime.utcnow()
        diff = now - dt.replace(tzinfo=None)
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
    except Exception:
        return "Unknown"
