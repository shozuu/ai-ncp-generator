"""
Admin Panel Setup Verification Script
Checks if all required configurations are in place
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
BACKEND_DIR = Path(__file__).resolve().parent
ENV_PATH = BACKEND_DIR / '.env'
load_dotenv(dotenv_path=ENV_PATH)

def check_env_var(name, required=True):
    """Check if environment variable is set"""
    value = os.getenv(name)
    if value:
        print(f"✅ {name} is set")
        return True
    else:
        if required:
            print(f"❌ {name} is NOT set (REQUIRED)")
        else:
            print(f"⚠️  {name} is NOT set (optional)")
        return False

def verify_setup():
    """Verify admin panel setup"""
    print("=" * 60)
    print("Admin Panel Setup Verification")
    print("=" * 60)
    print()
    
    all_good = True
    
    # Check required environment variables
    print("Checking Environment Variables...")
    print("-" * 60)
    
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "CLAUDE_API_KEY",
        "GEMINI_API_KEY"
    ]
    
    for var in required_vars:
        if not check_env_var(var):
            all_good = False
    
    print()
    
    # Check optional variables
    print("Optional Configuration...")
    print("-" * 60)
    check_env_var("ENVIRONMENT", required=False)
    check_env_var("ALLOWED_ORIGINS", required=False)
    
    print()
    
    # Check if files exist
    print("Checking Files...")
    print("-" * 60)
    
    files_to_check = [
        ("admin_routes.py", "Admin API routes"),
        ("make_admin.py", "Admin user setup script"),
        (".env", "Environment configuration"),
    ]
    
    for filename, description in files_to_check:
        filepath = BACKEND_DIR / filename
        if filepath.exists():
            print(f"✅ {description} ({filename})")
        else:
            print(f"❌ {description} ({filename}) NOT FOUND")
            all_good = False
    
    print()
    
    # Try to connect to Supabase
    print("Testing Supabase Connection...")
    print("-" * 60)
    
    try:
        from supabase import create_client
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if supabase_url and supabase_key:
            supabase = create_client(supabase_url, supabase_key)
            
            # Try a simple query
            result = supabase.table("ncps").select("id").limit(1).execute()
            print("✅ Supabase connection successful")
            print(f"   Database is accessible")
        else:
            print("❌ Cannot test connection - credentials missing")
            all_good = False
            
    except ImportError:
        print("⚠️  Supabase library not installed")
        print("   Run: pip install -r requirements.txt")
        all_good = False
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        all_good = False
    
    print()
    print("=" * 60)
    
    if all_good:
        print("✅ All checks passed! Admin panel is ready to use.")
        print()
        print("Next steps:")
        print("1. Run: python make_admin.py your-email@example.com")
        print("2. Start the backend: python main.py")
        print("3. Access admin panel at: http://localhost:5173/admin")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        print()
        print("Common fixes:")
        print("1. Copy .env.example to .env and fill in values")
        print("2. Install dependencies: pip install -r requirements.txt")
        print("3. Check Supabase credentials in .env")
    
    print("=" * 60)
    
    return all_good

if __name__ == "__main__":
    verify_setup()
