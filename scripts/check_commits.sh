#!/bin/sh
# check_commits.sh

echo "====================================="
echo "Starting commit check script..."
echo "====================================="

# Read arguments
branch="develop"
block_major=false
block_minor=false
block_patch=false

echo ""
echo "Parsing command-line arguments..."
echo "-------------------------------------"
while [ $# -gt 0 ]; do
  case "$1" in
    --branch)
      branch="$2"
      echo "Target branch set to: $branch"
      shift
      ;;
    --block-major)
      block_major=true
      echo "Blocking major changes enabled"
      ;;
    --block-minor)
      block_minor=true
      echo "Blocking minor changes enabled"
      ;;
    --block-patch)
      block_patch=true
      echo "Blocking patch changes enabled"
      ;;
    *)
      echo "Unknown parameter passed: $1"
      exit 1
      ;;
  esac
  shift
done
echo "-------------------------------------"

# Initialize variables to track the type of changes
has_patch=false
has_minor=false
has_major=false

# Display initial settings
echo ""
echo "Initial settings:"
echo "  Branch: $branch"
echo "  Block major changes: $block_major"
echo "  Block minor changes: $block_minor"
echo "  Block patch changes: $block_patch"
echo "-------------------------------------"

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ $? -ne 0 ]; then
  echo "Error retrieving current branch name."
  exit 1
fi

echo "Current branch is: $current_branch"

echo ""
echo "Checking if branch '$branch' exists remotely..."
if ! git show-branch remotes/origin/$branch; then
  echo "Error: Remote branch '$branch' does not exist or is not accessible."
  exit 1
fi

echo ""
echo "Fetching list of commits to compare from '$branch' into '$current_branch'..."
commit_hashes=$(git log --oneline --reverse --pretty=format:"%H" origin/$branch..$current_branch)
if [ $? -ne 0 ]; then
  echo "Error fetching commits from branch: '$branch'. Please check if the branch names are correct and branches are properly synchronized."
  exit 1
fi

number_of_commits=$(echo "$commit_hashes" | wc -l)
echo "Number of commits found: $number_of_commits"

if [ -z "$commit_hashes" ]; then
  echo "No commits found from '$branch' to '$current_branch'. Nothing to compare."
  exit 0
fi

# Initialize counters for blocking commit types
block_major_count=0
block_minor_count=0
block_patch_count=0

for commit in $commit_hashes; do
  message=$(git log -1 --pretty=%B "$commit")
  if [ $? -ne 0 ]; then
    echo "Error retrieving message for commit: $commit"
    exit 1
  fi

  # Check for major changes
  if [ "$block_major" = "true" ] && echo "$message" | grep -Eq "BREAKING CHANGE|!"; then
    echo ""
    echo "====================================="
    echo "Blocking major change detected in commit: $commit"
    echo "Commit message: $message"
    echo "====================================="
    has_major=true
    block_major_count=$((block_major_count + 1))
  fi

  # Check for minor changes (new features)
  if [ "$block_minor" = "true" ] && echo "$message" | grep -iq "^feat"; then
    echo ""
    echo "====================================="
    echo "Blocking minor change detected in commit: $commit"
    echo "Commit message: $message"
    echo "====================================="
    has_minor=true
    block_minor_count=$((block_minor_count + 1))
  fi

  # Check for patch changes (bug fixes)
  if [ "$block_patch" = "true" ] && echo "$message" | grep -iq "^fix"; then
    echo ""
    echo "====================================="
    echo "Blocking patch change detected in commit: $commit"
    echo "Commit message: $message"
    echo "====================================="
    has_patch=true
    block_patch_count=$((block_patch_count + 1))
  fi
done

# Output the blocking commits summary
echo ""
echo "-------------------------------------"
echo "Blocking commits summary:"
echo "-------------------------------------"
[ "$block_major_count" -gt 0 ] && echo "- Major blocking commits detected: $block_major_count"
[ "$block_minor_count" -gt 0 ] && echo "- Minor blocking commits detected: $block_minor_count"
[ "$block_patch_count" -gt 0 ] && echo "- Patch blocking commits detected: $block_patch_count"
echo "-------------------------------------"

# Exit with error messages based on the blocking rules
if [ "$has_major" = "true" ]; then
  echo ""
  echo "Blocking due to major changes."
  echo "Please review and address the major changes before proceeding."
  exit 1
fi

if [ "$has_minor" = "true" ]; then
  echo ""
  echo "Blocking due to minor changes."
  echo "Please review and address the minor changes before proceeding."
  exit 1
fi

if [ "$has_patch" = "true" ]; then
  echo ""
  echo "Blocking due to patch changes."
  echo "Please review and address the patch changes before proceeding."
  exit 1
fi

echo ""
echo "No blocking conditions met. Exiting successfully."
exit 0