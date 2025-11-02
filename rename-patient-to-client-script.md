# Patient to Client Rename Script

This is a comprehensive guide for renaming "patient" to "client" throughout the codebase.

## APPROACH

**SAFETY FIRST**: We'll use a script that:
1. Shows you what will be renamed
2. Creates backups
3. Updates content
4. Verifies no broken imports

## STEPS

### Step 1: List what needs to be renamed

Run this to see all files/dirs with "patient" in their name:

```bash
echo "=== DIRECTORIES ==="
find app lib hooks components -type d -name "*patient*" 2>/dev/null

echo "=== FILES ==="
find app lib hooks components -name "*patient*" -type f 2>/dev/null
```

### Step 2: Dry-run renames

```bash
# Show what would be renamed (without actually renaming)
find app lib hooks components -type d -name "*patient*" 2>/dev/null | while read dir; do
  newdir=$(echo "$dir" | sed 's/patient/client/g')
  if [ "$dir" != "$newdir" ]; then
    echo "Would rename: $dir -> $newdir"
  fi
done

find app lib hooks components -name "*patient*" -type f 2>/dev/null | while read file; do
  newfile=$(echo "$file" | sed 's/patient/client/g')
  if [ "$file" != "$newfile" ]; then
    echo "Would rename: $file -> $newfile"
  fi
done
```

### Step 3: Actual renames (COMMIT FIRST!)

```bash
# ONLY DO THIS AFTER GIT COMMIT
find app lib hooks components -type d -name "*patient*" 2>/dev/null | while read dir; do
  newdir=$(echo "$dir" | sed 's/patient/client/g')
  if [ "$dir" != "$newdir" ]; then
    mv "$dir" "$newdir"
  fi
done

find app lib hooks components -name "*patient*" -type f 2>/dev/null | while read file; do
  newfile=$(echo "$file" | sed 's/patient/client/g')
  if [ "$file" != "$newfile" ]; then
    mv "$file" "$newfile"
  fi
done
```

### Step 4: Update content in code files

```bash
# Update patient -> client (case-insensitive, whole word)
find app lib hooks components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/\bpatient\b/client/g' {} +
find app lib hooks components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/\bPatient\b/Client/g' {} +
find app lib hooks components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/\bpatients\b/clients/g' {} +
find app lib hooks components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/\bPatients\b/Clients/g' {} +
```

### Step 5: Update imports

```bash
# Update import paths
find app lib hooks components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's@/patient/@/client/@g' {} +
find app lib hooks components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's@patient-data@client-data@g' {} +
find app lib hooks components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's@patient_@client_@g' {} +
```

### Step 6: Update API routes

Update these API endpoint patterns:
- `/api/patient/biodata` → `/api/client/biodata`
- `/api/patient/family-history` → `/api/client/family-history`
- `/api/patient/social-history` → `/api/client/social-history`
- `/api/patient/medical-history` → `/api/client/medical-history`
- `/api/patient/drug-history` → `/api/client/drug-history`

## CRITICAL: Database Tables

⚠️ **Database tables ending with "_patient" should be renamed too**, but this requires a migration:

Tables to rename:
- `patient_biodata` → `client_biodata`
- `patient_family_history` → `client_family_history`
- `patient_social_history` → `client_social_history`
- `patient_medical_history` → `client_medical_history`
- `patient_drug_history` → `client_drug_history`

**DO NOT rename database tables without proper migration!**

## TESTING

After changes, run:
```bash
# Check for syntax errors
npm run build

# Run linter
npm run lint

# Check for remaining "patient" references in code
grep -r "\bpatient\b" app lib hooks components --include="*.ts" --include="*.tsx" | grep -v "node_modules" | head -20
```

