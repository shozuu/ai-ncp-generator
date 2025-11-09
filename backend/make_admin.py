"""
Script to make a user an admin
Usage: python make_admin.py user@example.com
"""
import sys
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def make_admin(email: str, admin_level: str = "super"):
    """Make a user an admin by updating their metadata
    
    Args:
        email: User's email address
        admin_level: "super" or "regular" (default: "super")
    """
    try:
        # Validate admin level
        if admin_level not in ["super", "regular"]:
            print(f"❌ Invalid admin level: {admin_level}. Must be 'super' or 'regular'")
            return False
        
        # Get user by email
        users = supabase.auth.admin.list_users()
        
        user_found = None
        for user in users:
            if user.email == email:
                user_found = user
                break
        
        if not user_found:
            print(f"❌ User with email '{email}' not found")
            return False
        
        # Update user metadata to add admin flag
        supabase.auth.admin.update_user_by_id(
            user_found.id,
            {"user_metadata": {
                "is_admin": True,
                "admin_level": admin_level
            }}
        )
        
        print(f"✅ Successfully made {email} a {admin_level} admin!")
        print(f"   User ID: {user_found.id}")
        print(f"   Admin Level: {admin_level.upper()}")
        
        if admin_level == "super":
            print(f"\n🔐 SUPER ADMIN privileges:")
            print(f"   • Full admin panel access")
            print(f"   • Can promote/demote other admins")
            print(f"   • Cannot be demoted by other admins")
            print(f"   • Cannot be deleted")
        else:
            print(f"\n👤 REGULAR ADMIN privileges:")
            print(f"   • Admin panel access")
            print(f"   • Can manage users (suspend/delete)")
            print(f"   • Cannot promote/demote admins")
        
        print(f"\n⚠️  The user needs to log out and log back in for changes to take effect.")
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print("Usage: python make_admin.py user@example.com [super|regular]")
        print("\nExamples:")
        print("  python make_admin.py user@example.com          # Creates super admin (default)")
        print("  python make_admin.py user@example.com super    # Creates super admin")
        print("  python make_admin.py user@example.com regular  # Creates regular admin")
        sys.exit(1)
    
    email = sys.argv[1]
    admin_level = sys.argv[2] if len(sys.argv) == 3 else "super"
    make_admin(email, admin_level)
