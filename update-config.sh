#!/bin/bash
set -e

# This script helps with setting up environment configurations

# Function to display help
show_help() {
  echo "Usage: ./update-config.sh [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help                  Show this help message"
  echo "  -p, --prepare-placeholders  Prepare the config.ts to use placeholders"
  echo "  -b, --build-with-placeholders  Build with placeholders for runtime injection"
  echo ""
}

# Function to prepare placeholders in config.ts
prepare_placeholders() {
  echo "Preparing config.ts to use placeholders..."
  
  # First backup the original config
  if [ -f "src/config.ts" ]; then
    cp src/config.ts src/config.ts.bak
    echo "Backed up src/config.ts to src/config.ts.bak"
  fi
  
  # Update config.ts to use placeholders
  cat > src/config.ts << 'EOF'
import { AppConfig } from "./types/config";

export const config: AppConfig = {
	url: process.env.NEXT_PUBLIC_URL ?? "",
	logos_url: process.env.NEXT_PUBLIC_LOGOS_URL ?? "",
	graphqlUrl: "PLACEHOLDER_GRAPHQL_URL",
	auth0: {
		domain: "PLACEHOLDER_AUTH0_DOMAIN",
		clientId: "PLACEHOLDER_AUTH0_CLIENT_ID",
		audience: "PLACEHOLDER_AUTH0_AUDIENCE",
	},
	gaMeasurementId: "PLACEHOLDER_GA_MEASUREMENT_ID",
	amplitudeApiKey: "PLACEHOLDER_AMPLITUDE_API_KEY",
};
EOF
  
  echo "Updated src/config.ts to use placeholders"
}

# Function to build with placeholders
build_with_placeholders() {
  echo "Building with placeholders for runtime injection..."
  npm run build && node replace-placeholders.mjs
  echo "Build completed with placeholders for runtime injection"
}

# Parse command line arguments
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;
    -p|--prepare-placeholders)
      prepare_placeholders
      shift
      ;;
    -b|--build-with-placeholders)
      build_with_placeholders
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

exit 0 
