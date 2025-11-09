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

# Create router
admin_router = APIRouter(prefix="/api/admin", tags=["admin"])

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
        
        # Verify user with Supabase
        user = supabase.auth.get_user(token)
        
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if user is admin (from user_metadata or app_metadata)
        user_data = user.user
        is_admin = (
            user_data.user_metadata.get("is_admin", False) or
            user_data.app_metadata.get("is_admin", False)
        )
        
        if not is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        return user_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin verification error: {str(e)}")
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


@admin_router.get("/dashboard-stats")
async def get_dashboard_stats(admin_user = Depends(verify_admin)):
    """
    Get dashboard statistics including user counts, NCP counts, and trends
    """
    try:
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
        
        # Get chart data (last 30 days)
        logger.info("Generating chart data...")
        chart_data = []
        try:
            for i in range(29, -1, -1):
                day = datetime.utcnow() - timedelta(days=i)
                day_start = day.replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
                day_end = (day + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
                
                try:
                    day_ncps = supabase.table("ncps").select("id", count="exact").gte("created_at", day_start).lt("created_at", day_end).execute()
                    count = day_ncps.count if day_ncps else 0
                except Exception as e:
                    logger.error(f"Error fetching day NCPs: {str(e)}")
                    count = 0
                
                chart_data.append({
                    "date": day.strftime("%b %d"),
                    "count": count
                })
            logger.info(f"Chart data generated: {len(chart_data)} days")
        except Exception as e:
            logger.error(f"Error generating chart data: {str(e)}", exc_info=True)
            chart_data = []
        
        # Get top diagnoses
        logger.info("Fetching top diagnoses...")
        diagnosis_counts = {}
        try:
            all_ncps = supabase.table("ncps").select("diagnosis").execute()
        except Exception as e:
            logger.error(f"Error fetching diagnoses: {str(e)}", exc_info=True)
            all_ncps = None
        
        if all_ncps and all_ncps.data:
            for ncp in all_ncps.data:
                try:
                    if ncp.get("diagnosis"):
                        diagnosis_text = ncp["diagnosis"].get("diagnosis", "") if isinstance(ncp["diagnosis"], dict) else str(ncp["diagnosis"])
                        if diagnosis_text:
                            diagnosis_counts[diagnosis_text] = diagnosis_counts.get(diagnosis_text, 0) + 1
                except Exception as e:
                    logger.error(f"Error processing diagnosis: {str(e)}")
                    continue
        
        # Get top 5 diagnoses
        sorted_diagnoses = sorted(diagnosis_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_diagnoses = [
            {
                "name": diag[0][:50] + "..." if len(diag[0]) > 50 else diag[0],
                "count": diag[1],
                "percentage": round((diag[1] / total_ncps * 100), 1) if total_ncps > 0 else 0
            }
            for diag in sorted_diagnoses
        ]
        
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
        
    except Exception as e:
        logger.error(f"FATAL ERROR in dashboard stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@admin_router.get("/users")
async def get_users(admin_user = Depends(verify_admin)):
    """
    Get all users with their statistics
    """
    try:
        # Get all users from Supabase Auth
        auth_users = supabase.auth.admin.list_users()
        
        if not auth_users:
            return []
        
        # Get NCP counts for each user
        user_list = []
        for user in auth_users:
            # Get NCP count
            ncp_count_result = supabase.table("ncps").select("id", count="exact").eq("user_id", user.id).execute()
            ncp_count = ncp_count_result.count if ncp_count_result else 0
            
            # Get user profile from profiles table
            full_name = ""
            try:
                profile_result = supabase.table("profiles").select("first_name, last_name").eq("id", user.id).execute()
                if profile_result.data and len(profile_result.data) > 0:
                    profile = profile_result.data[0]
                    # Build full name from profile data (first name + last name only)
                    name_parts = [
                        profile.get("first_name", ""),
                        profile.get("last_name", "")
                    ]
                    full_name = " ".join(part for part in name_parts if part).strip()
            except Exception as profile_error:
                logger.debug(f"Could not fetch profile for user {user.id}: {str(profile_error)}")
            
            # Fallback 1: Try to get name from user_metadata (for backward compatibility)
            if not full_name:
                first_name = user.user_metadata.get("first_name", "")
                last_name = user.user_metadata.get("last_name", "")
                
                if first_name or last_name:
                    # Display first name + last name only (no middle name)
                    name_parts = [first_name, last_name]
                    full_name = " ".join(part for part in name_parts if part).strip()
                else:
                    # Try other common metadata fields
                    full_name = (
                        user.user_metadata.get("full_name") or 
                        user.user_metadata.get("name") or 
                        ""
                    ).strip()
            
            # Fallback 2: Extract name from email (e.g., "john.doe@example.com" -> "John Doe")
            if not full_name and user.email:
                email_name = user.email.split('@')[0]
                # Replace common separators with spaces and capitalize
                full_name = email_name.replace('.', ' ').replace('_', ' ').replace('-', ' ').title()
            
            user_list.append({
                "id": user.id,
                "email": user.email,
                "full_name": full_name,
                "created_at": user.created_at,
                "last_sign_in_at": user.last_sign_in_at,
                "email_confirmed_at": user.email_confirmed_at,
                "is_suspended": user.user_metadata.get("is_suspended", False),
                "is_admin": user.user_metadata.get("is_admin", False),
                "admin_level": user.user_metadata.get("admin_level", None),
                "ncp_count": ncp_count
            })
        
        return user_list
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


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
        # Update user metadata
        supabase.auth.admin.update_user_by_id(
            user_id,
            {"user_metadata": {"is_suspended": status_update.suspended}}
        )
        
        return {
            "success": True,
            "message": f"User {'suspended' if status_update.suspended else 'activated'} successfully"
        }
    except Exception as e:
        logger.error(f"Error updating user status: {str(e)}")
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
