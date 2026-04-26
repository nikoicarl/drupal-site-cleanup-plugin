#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------
# DDEV + Drupal automated setup with arguments
# ---------------------------------------------
# Usage:
#   ./setup-drupal-ddev.sh [-n PROJECT_NAME] [-u ADMIN_USER] [-p ADMIN_PASS] [-v DRUPAL_VERSION] [--no-auto-login]
#
# Examples:
#   ./setup-drupal-ddev.sh
#   ./setup-drupal-ddev.sh -n mysite -u admin -p pass123 -v 10
#   ./setup-drupal-ddev.sh -n my-drupal11 -v 11 --no-auto-login
#
# Notes:
# - Requires DDEV to be installed and working on your system.
# - Composer runs inside the DDEV container.
# - The script is idempotent where sensible (won't recreate if already present).
# ---------------------------------------------

# Defaults
PROJECT_NAME="my-drupal-site"
ADMIN_USER="admin"
ADMIN_PASS="admin"
DRUPAL_VERSION="9"         # Allowed: 9, 10, 11
AUTO_LOGIN=true

# Parse arguments
print_help() {
  sed -n '2,40p' "$0"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--name)
      PROJECT_NAME="${2:-}"; shift 2 ;;
    -u|--admin-user)
      ADMIN_USER="${2:-}"; shift 2 ;;
    -p|--admin-pass)
      ADMIN_PASS="${2:-}"; shift 2 ;;
    -v|--version)
      DRUPAL_VERSION="${2:-}"; shift 2 ;;
    --no-auto-login)
      AUTO_LOGIN=false; shift ;;
    -h|--help)
      print_help; exit 0 ;;
    *)
      echo "Unknown argument: $1"
      print_help
      exit 1 ;;
  esac
done

# Validate Drupal version
if [[ ! "$DRUPAL_VERSION" =~ ^(9|10|11)$ ]]; then
  echo "Error: -v|--version must be one of: 9, 10, 11"
  exit 1
fi

# Map DDEV project type by major Drupal version
# DDEV supports project types like: drupal9, drupal10, drupal11 (recent versions)
PROJECT_TYPE="drupal${DRUPAL_VERSION}"

# Check dependencies
if ! command -v ddev >/dev/null 2>&1; then
  echo "Error: ddev is not installed or not in PATH."
  echo "Install DDEV: https://ddev.readthedocs.io/en/stable/"
  exit 1
fi

echo "-------------------------------"
echo "Settings:"
echo "  Project name : $PROJECT_NAME"
echo "  Drupal       : $DRUPAL_VERSION (DDEV project type: $PROJECT_TYPE)"
echo "  Admin user   : $ADMIN_USER"
echo "  Auto-login   : $AUTO_LOGIN"
echo "-------------------------------"

# Create project directory (if not exists)
if [[ -d "$PROJECT_NAME" ]]; then
  echo "Directory '$PROJECT_NAME' already exists. Using it."
else
  echo "Creating project directory: $PROJECT_NAME"
  mkdir -p "$PROJECT_NAME"
fi
cd "$PROJECT_NAME"

# Initialize DDEV config if absent
if [[ ! -f ".ddev/config.yaml" ]]; then
  echo "Configuring DDEV for $PROJECT_TYPE with docroot 'web'..."
  ddev config --project-type="$PROJECT_TYPE" --docroot=web
else
  echo "DDEV config already present. Skipping 'ddev config'."
fi

# Start DDEV
echo "Starting DDEV..."
ddev start

# Create Drupal project if not already created
if [[ ! -f "web/composer.json" ]]; then
  echo "Creating Drupal recommended project (^$DRUPAL_VERSION)..."
  ddev composer create-project "drupal/recommended-project:^$DRUPAL_VERSION" .
else
  echo "Drupal composer project already exists at web/. Skipping create-project."
fi

# Ensure Drush is present
if ddev composer show drush/drush >/dev/null 2>&1; then
  echo "Drush already required. Skipping."
else
  echo "Installing Drush..."
  ddev composer require drush/drush
fi

# Detect if site is already installed
IS_INSTALLED=false
if ddev drush status --fields=bootstrap 2>/dev/null | grep -qi "Successful"; then
  IS_INSTALLED=true
else
  # Fallback quick check for settings.php presence
  if [[ -f "web/sites/default/settings.php" ]]; then
    # Still might not be fully installed, but assume installed to avoid overwriting.
    IS_INSTALLED=true
  fi
fi

if [[ "$IS_INSTALLED" == true ]]; then
  echo "Drupal appears to be installed already. Skipping site:install."
else
  echo "Installing Drupal site..."
  ddev drush site:install \
    --account-name="$ADMIN_USER" \
    --account-pass="$ADMIN_PASS" \
    -y
fi

# Launch browser; optionally auto-login
if [[ "$AUTO_LOGIN" == true ]]; then
  echo "Generating one-time login URL and launching..."
  LOGIN_URL="$(ddev drush uli)"
  ddev launch "$LOGIN_URL"
else
  echo "Launching site without auto-login..."
  ddev launch
fi

echo "-------------------------------------"
echo "Setup complete!"
echo "Project directory : $(pwd)"
echo "DDEV project name : $(basename "$(pwd)")"
echo "Drupal version    : $DRUPAL_VERSION"
echo "Admin user        : $ADMIN_USER"
if [[ "$AUTO_LOGIN" == false ]]; then
  echo "Tip: To log in, run: ddev drush uli"
fi
echo "-------------------------------------"