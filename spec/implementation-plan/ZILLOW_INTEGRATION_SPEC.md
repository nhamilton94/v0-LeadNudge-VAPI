# Zillow Contact Integration Specification

## Overview
This specification outlines the requirements for integrating Zillow contact webhooks with our LeadNudge system, including property management and contact tracking.

## Requirements Summary
1. Accept Zillow contact webhooks with property information
2. Create/lookup properties using address + postal code matching
3. Link contacts to properties via `interested_property` field
4. Create property assignments for property owners/agents
5. Maintain existing contact creation and automation workflows

## Sample Zillow Payload
```json
{
  "listingCity": "Belleville",
  "creditScoreRangeJson": "{\"creditScoreMin\":720,\"creditScoreMax\":799}",
  "numBedrooms": "3",
  "globalListingId": "4rs802tumknzq",
  "incomeYearly": "84",
  "petDetailsJson": "[{\"type\":\"none\",\"description\":\"no pets\"}]",
  "hasTourRequest": "true",
  "email": "cherryannpj@gmail.com",
  "providerModelId": "wk25ze0jacha",
  "numBedroomsSought": "3",
  "hasPets": "no",
  "listingContactEmail": "chikaeogele@gmail.com",
  "numOccupants": "4",
  "listingPostalCode": "07109",
  "listingId": "435572n8c6m4j",
  "message": "I would like to schedule a tour...",
  "listingUnit": "1",
  "listingStreet": "14 Cuozzo St",
  "leaseLengthMonths": "12",
  "moveInDate": "2026-01-31",
  "leadType": "tourRequest",
  "phone": "347-600-8325",
  "numBathroomsSought": "",
  "movingDate": "20260131",
  "name": "Cherryann Joseph",
  "listingState": "NJ"
}
```

## Database Schema Changes Required

### 1. Properties Table Additions
Add the following columns to the `properties` table:

```sql
-- Add unit/apartment number support
ALTER TABLE public.properties 
ADD COLUMN unit VARCHAR(50);

-- Add Zillow-specific fields for better property management
ALTER TABLE public.properties 
ADD COLUMN zillow_listing_id VARCHAR(255),
ADD COLUMN zillow_global_listing_id VARCHAR(255),
ADD COLUMN lease_length_months INTEGER,
ADD COLUMN available_date DATE;

-- Add indexes for performance
CREATE INDEX idx_properties_zillow_listing_id ON public.properties(zillow_listing_id);
CREATE INDEX idx_properties_address_zip ON public.properties(address, zip);
CREATE INDEX idx_properties_street_zip ON public.properties(address, zip, unit);
```

### 2. Contacts Table Additions
Add Zillow-specific contact fields:

```sql
-- Add Zillow lead tracking fields
ALTER TABLE public.contacts 
ADD COLUMN move_in_date DATE,
ADD COLUMN lease_length_preference INTEGER,
ADD COLUMN credit_score_min INTEGER,
ADD COLUMN credit_score_max INTEGER,
ADD COLUMN yearly_income DECIMAL(12,2),
ADD COLUMN num_occupants INTEGER,
ADD COLUMN has_pets BOOLEAN,
ADD COLUMN pet_details JSONB,
ADD COLUMN bedrooms_sought INTEGER,
ADD COLUMN bathrooms_sought INTEGER,
ADD COLUMN zillow_lead_type VARCHAR(100),
ADD COLUMN zillow_global_listing_id VARCHAR(255);
```

## Implementation Plan

### Phase 1: Database Migration
1. Create and run migration files for the schema changes above
2. Update `database.types.ts` to reflect new columns
3. Test migrations in development environment

### Phase 2: API Enhancement
1. **Update ZillowContactRequest Interface**
   ```typescript
   interface ZillowContactRequest {
     // Existing required fields
     phone: string
     email: string
     name: string
     listingContactEmail: string
     
     // New required property fields
     listingStreet: string
     listingPostalCode: string
     listingCity: string
     listingState: string
     
     // Optional Zillow fields
     listingUnit?: string
     numBedrooms?: string
     numBathrooms?: string
     numBedroomsSought?: string
     numBathroomsSought?: string
     moveInDate?: string
     movingDate?: string
     leaseLengthMonths?: string
     message?: string
     leadType?: string
     creditScoreRangeJson?: string
     incomeYearly?: string
     numOccupants?: string
     hasPets?: string
     petDetailsJson?: string
     zillow_listing_id?: string
     globalListingId?: string
   }
   ```

2. **Property Lookup/Creation Logic**
   ```typescript
   async function findOrCreateProperty(
     listingStreet: string,
     listingPostalCode: string,
     listingCity: string,
     listingState: string,
     listingUnit: string | undefined,
     profileData: any,
     zillowData: any
   ) {
     // 1. Try exact match first
     let property = await supabase
       .from('properties')
       .select('*')
       .eq('address', listingStreet)
       .eq('zip', listingPostalCode)
       .eq('unit', listingUnit || null)
       .eq('organization_id', profileData.organization_id)
       .single()
   
     // 2. If not found, try fuzzy match on address
     if (!property.data) {
       property = await supabase
         .from('properties')
         .select('*')
         .ilike('address', `%${listingStreet}%`)
         .eq('zip', listingPostalCode)
         .eq('organization_id', profileData.organization_id)
         .maybeSingle()
     }
   
     // 3. If still not found, create new property
     if (!property.data) {
       const newProperty = await supabase
         .from('properties')
         .insert({
           address: listingStreet,
           city: listingCity,
           state: listingState,
           zip: listingPostalCode,
           unit: listingUnit || null,
           organization_id: profileData.organization_id,
           created_by: profileData.id,
           property_type: 'residential',
           status: 'available',
           zillow_listing_id: zillowData.listingId,
           zillow_global_listing_id: zillowData.globalListingId,
           lease_length_months: zillowData.leaseLengthMonths ? parseInt(zillowData.leaseLengthMonths) : null,
           available_date: zillowData.moveInDate || null,
           bedrooms: zillowData.numBedrooms ? parseInt(zillowData.numBedrooms) : null
         })
         .select()
         .single()
   
       // Create property assignment for the listing owner
       await supabase
         .from('property_assignments')
         .insert({
           user_id: profileData.id,
           property_id: newProperty.data.id,
           organization_id: profileData.organization_id,
           assigned_by: profileData.id,
           assigned_at: new Date().toISOString()
         })
   
       return newProperty.data
     }
   
     return property.data
   }
   ```

3. **Enhanced Contact Creation**
   ```typescript
   // Parse credit score range
   let creditScoreMin = null, creditScoreMax = null
   if (body.creditScoreRangeJson) {
     try {
       const creditRange = JSON.parse(body.creditScoreRangeJson)
       creditScoreMin = creditRange.creditScoreMin
       creditScoreMax = creditRange.creditScoreMax
     } catch (e) {
       console.warn('Failed to parse credit score range:', e)
     }
   }
   
   // Parse pet details
   let petDetails = null, hasPets = null
   if (body.petDetailsJson) {
     try {
       petDetails = JSON.parse(body.petDetailsJson)
       hasPets = body.hasPets === 'yes' || (petDetails && petDetails[0]?.type !== 'none')
     } catch (e) {
       console.warn('Failed to parse pet details:', e)
     }
   }
   
   // Enhanced contact data
   const contactData = {
     // Existing fields...
     name: body.name,
     first_name,
     last_name,
     email: body.email,
     phone: body.phone,
     status: lead_status,
     lead_source: 'zillow',
     lead_status,
     user_id: profileData.id,
     created_by: profileData.id,
     assigned_to: profileData.id,
     interested_property: property.id,
     
     // New Zillow-specific fields
     move_in_date: body.moveInDate || body.movingDate || null,
     lease_length_preference: body.leaseLengthMonths ? parseInt(body.leaseLengthMonths) : null,
     credit_score_min: creditScoreMin,
     credit_score_max: creditScoreMax,
     yearly_income: body.incomeYearly ? parseFloat(body.incomeYearly) : null,
     num_occupants: body.numOccupants ? parseInt(body.numOccupants) : null,
     has_pets: hasPets,
     pet_details: petDetails,
     bedrooms_sought: body.numBedroomsSought ? parseInt(body.numBedroomsSought) : null,
     bathrooms_sought: body.numBathroomsSought ? parseInt(body.numBathroomsSought) : null,
     zillow_lead_type: body.leadType,
     zillow_global_listing_id: body.globalListingId
   }
   ```

### Phase 3: Validation & Testing
1. **Field Validation Updates**
   ```typescript
   // Update required field validation
   if (!body.phone || !body.email || !body.name || !body.listingContactEmail || 
       !body.listingStreet || !body.listingPostalCode) {
     return NextResponse.json({
       error: "Missing required fields: phone, email, name, listingContactEmail, listingStreet, and listingPostalCode are required"
     }, { status: 400 })
   }
   ```

2. **Test Scenarios**
   - Exact property match (existing property)
   - Fuzzy property match (slight address variation)
   - New property creation
   - Contact with all optional fields
   - Contact with minimal fields
   - Invalid listingContactEmail
   - Duplicate contact scenarios

## Error Handling Strategy

1. **Property Creation Fails**: Log error, continue with contact creation but set `interested_property` to null
2. **Property Assignment Fails**: Log warning, continue (not critical for contact creation)
3. **Invalid Zillow Data**: Parse what's possible, use defaults for invalid fields
4. **Database Transaction**: Wrap property creation and assignment in transaction for consistency

## Performance Considerations

1. **Database Indexes**: Add indexes on frequently queried columns
2. **Caching**: Consider caching property lookups for high-volume scenarios
3. **Batch Operations**: If receiving multiple contacts for same property, optimize property lookups

## Migration Timeline

1. **Week 1**: Database schema updates and migration
2. **Week 2**: API implementation and testing
3. **Week 3**: Integration testing with Zillow webhook
4. **Week 4**: Production deployment and monitoring

## Rollback Plan

If issues arise, the implementation can be rolled back by:
1. Reverting API changes (property logic is additive)
2. Database columns can remain (they're nullable and optional)
3. Existing contact creation flow remains unchanged

This approach ensures backward compatibility while adding the new property integration functionality.