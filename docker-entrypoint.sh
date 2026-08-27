#!/bin/bash
set -e

# Environment variables are now baked into the build at build-time
# This script just executes the main command

# Execute the main command
exec "$@" 