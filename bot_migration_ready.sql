-- =====================================================
-- BOT CUSTOMIZATION - DATABASE MIGRATION
-- =====================================================
-- Purpose: Store bot customization settings per organization
-- Supports: Greeting messages, qualification questions, FAQs, scheduling messages
-- Organization-scoped with optional property-level customization
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE BOT_CUSTOMIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bot_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Settings
    greeting_message TEXT NOT NULL,
    tour_confirmation_message TEXT NOT NULL,
    not_qualified_message TEXT NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    
    -- Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    updated_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Ensure only one customization per property (or one global per org if property_id is NULL)
    CONSTRAINT unique_org_property UNIQUE (organization_id, property_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bot_customizations_org_id ON public.bot_customizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_bot_customizations_property_id ON public.bot_customizations(property_id);
CREATE INDEX IF NOT EXISTS idx_bot_customizations_status ON public.bot_customizations(status);

-- Add comment
COMMENT ON TABLE public.bot_customizations IS 'Stores bot customization settings per organization (global or property-specific)';

-- =====================================================
-- 2. CREATE QUALIFICATION_QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.qualification_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_customization_id UUID NOT NULL REFERENCES public.bot_customizations(id) ON DELETE CASCADE,
    
    -- Question details
    question_text TEXT NOT NULL,
    answer_type VARCHAR(50) NOT NULL CHECK (answer_type IN ('text', 'numeric', 'yes_no', 'date', 'multiple_choice')),
    is_required BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL,
    
    -- Rules and options
    disqualifier_rule TEXT,
    multiple_choice_options JSONB,
    
    -- Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique order within customization
    CONSTRAINT unique_customization_order UNIQUE (bot_customization_id, order_index)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_qualification_questions_customization_id ON public.qualification_questions(bot_customization_id);
CREATE INDEX IF NOT EXISTS idx_qualification_questions_order ON public.qualification_questions(bot_customization_id, order_index);

-- Add comment
COMMENT ON TABLE public.qualification_questions IS 'Stores qualification questions for bot conversations';

-- =====================================================
-- 3. CREATE FAQ_LIBRARY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.faq_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- FAQ content
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    -- Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_faq_library_org_id ON public.faq_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_faq_library_property_id ON public.faq_library(property_id);

-- Add comment
COMMENT ON TABLE public.faq_library IS 'Stores FAQ questions and answers (global or property-specific)';

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.bot_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualification_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_library ENABLE ROW LEVEL SECURITY;

-- Bot Customizations: Users can only see their organization's customizations
CREATE POLICY "Users can view their organization's bot customizations"
    ON public.bot_customizations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Bot Customizations: Only admins can insert/update/delete
CREATE POLICY "Admins can manage bot customizations"
    ON public.bot_customizations FOR ALL
    USING (
        organization_id IN (
            SELECT ur.organization_id 
            FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Qualification Questions: Users can view questions for their org's customizations
CREATE POLICY "Users can view qualification questions"
    ON public.qualification_questions FOR SELECT
    USING (
        bot_customization_id IN (
            SELECT id FROM public.bot_customizations
            WHERE organization_id IN (
                SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Qualification Questions: Only admins can manage
CREATE POLICY "Admins can manage qualification questions"
    ON public.qualification_questions FOR ALL
    USING (
        bot_customization_id IN (
            SELECT bc.id FROM public.bot_customizations bc
            JOIN public.user_roles ur ON bc.organization_id = ur.organization_id
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- FAQ Library: Users can view their organization's FAQs
CREATE POLICY "Users can view FAQ library"
    ON public.faq_library FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- FAQ Library: Only admins can manage
CREATE POLICY "Admins can manage FAQ library"
    ON public.faq_library FOR ALL
    USING (
        organization_id IN (
            SELECT ur.organization_id 
            FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- =====================================================
-- 5. CREATE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_bot_customizations_updated_at
    BEFORE UPDATE ON public.bot_customizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qualification_questions_updated_at
    BEFORE UPDATE ON public.qualification_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_library_updated_at
    BEFORE UPDATE ON public.faq_library
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

