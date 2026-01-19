# Supabase Service Role RLS Policies for Zillow Integration

## The Service Role RLS Confusion Explained

### What I Said vs. Reality:
- ❌ **What I incorrectly stated**: "Service role bypasses RLS automatically"
- ✅ **The truth**: Service role CAN bypass RLS, but only with explicit policies

### How Supabase RLS Actually Works:
1. **RLS is enabled by default** and blocks ALL access unless explicitly allowed
2. **Service role has special privileges** but still needs permission via policies
3. **Service role policies** use `auth.role() = 'service_role'` condition
4. **Without service role policies**, even the service role gets blocked by RLS

## Required Service Role Policies

Run these SQL commands in your Supabase SQL Editor to enable service role access:

### 1. Profiles Table (CRITICAL - This is blocking your webhook)
```sql
CREATE POLICY "Service role full access to profiles"
ON public.profiles
FOR ALL
TO public
USING (auth.role() = 'service_role');
```

### 2. Properties Table
```sql
CREATE POLICY "Service role full access to properties"
ON public.properties
FOR ALL
TO public
USING (auth.role() = 'service_role');
```

### 3. Property Assignments Table
```sql
CREATE POLICY "Service role full access to property_assignments"
ON public.property_assignments
FOR ALL
TO public
USING (auth.role() = 'service_role');
```

### 4. Contacts Table
```sql
CREATE POLICY "Service role full access to contacts"
ON public.contacts
FOR ALL
TO public
USING (auth.role() = 'service_role');
```

### 5. Qualification Status Table
```sql
CREATE POLICY "Service role full access to qualification_status"
ON public.qualification_status
FOR ALL
TO public
USING (auth.role() = 'service_role');
```

## Why These Are Needed

### Your Current Service Role Policies:
- ✅ `conversations` - Has service role policy
- ✅ `messages` - Has service role policy
- ❌ `profiles` - **MISSING** (this breaks your webhook)
- ❌ `properties` - **MISSING**
- ❌ `property_assignments` - **MISSING**
- ❌ `contacts` - **MISSING**
- ❌ `qualification_status` - **MISSING**

### The Webhook Flow:
1. **Step 1**: Look up user by email in `profiles` table → **BLOCKED** (no service role policy)
2. **Step 2**: Create property in `properties` table → **WOULD BE BLOCKED**
3. **Step 3**: Create property assignment → **WOULD BE BLOCKED**
4. **Step 4**: Create contact in `contacts` table → **WOULD BE BLOCKED**

## Alternative Approach: Disable RLS Temporarily

If you want to test quickly, you can temporarily disable RLS on these tables:

```sql
-- TEMPORARY - Disable RLS for testing (NOT RECOMMENDED for production)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualification_status DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING**: This makes your data publicly accessible! Only use for testing.

## My Apology

I apologize for the confusion about service role behavior. I should have been clearer that:

1. **Service role is powerful** but not magic
2. **RLS policies are explicit** - each table needs permission
3. **Service role needs policies** just like regular users
4. **The difference**: Service role policies use `auth.role() = 'service_role'` instead of user-specific conditions

## Recommended Implementation Order

1. **Add profiles policy first** (fixes immediate webhook issue)
2. **Test webhook** to confirm it works
3. **Add remaining policies** for complete functionality
4. **Test full Zillow integration flow**

## Verification

After adding the policies, test with this SQL to confirm service role access:

```sql
-- This should return data when run with service role key
SELECT auth.role(); -- Should return 'service_role'
SELECT * FROM profiles LIMIT 1; -- Should return data, not RLS error
```