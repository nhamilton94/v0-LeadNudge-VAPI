'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GreetingEditor } from '@/components/bot-customization/greeting-editor';
import { QualificationQuestionsManager } from '@/components/bot-customization/qualification-questions-manager';
import { FAQLibraryManager } from '@/components/bot-customization/faq-library-manager';
import { SchedulingMessagesEditor } from '@/components/bot-customization/scheduling-messages-editor';
import {
  type BotCustomizationFormData,
  DEFAULT_GREETING,
  DEFAULT_TOUR_CONFIRMATION,
  DEFAULT_NOT_QUALIFIED,
  DEFAULT_QUALIFICATION_QUESTIONS,
} from '@/types/bot-customization';
import { Save, RotateCcw, Send, ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/supabase-auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, HelpCircle, BookOpen, CalendarCheck } from 'lucide-react';

interface BotCustomizationTabProps {
  isAdmin: boolean;
}

export default function BotCustomizationTab({ isAdmin }: BotCustomizationTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Get organization_id from user metadata
  useEffect(() => {
    if (user?.user_metadata?.organization_id) {
      setOrganizationId(user.user_metadata.organization_id);
    }
  }, [user]);

  const [formData, setFormData] = useState<BotCustomizationFormData>({
    property_scope: 'all',
    selected_property_id: null,
    greeting_message: DEFAULT_GREETING,
    qualification_questions: DEFAULT_QUALIFICATION_QUESTIONS.map((q, idx) => ({
      ...q,
      id: `default-${idx}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
    faqs: [],
    tour_confirmation_message: DEFAULT_TOUR_CONFIRMATION,
    not_qualified_message: DEFAULT_NOT_QUALIFIED,
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      // TODO: Implement API call when backend is ready
      // API call should include:
      // - organizationId (from user context)
      // - formData (current bot customization settings)
      // - Backend must verify user has 'admin' role
      // Example:
      // const response = await fetch('/api/bot-customization', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ organizationId, ...formData }),
      // });
      
      setTimeout(() => {
        toast({
          title: 'Draft saved',
          description: 'Your bot customization changes have been saved as a draft.',
        });
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // TODO: Implement API call when backend is ready
      // API call should include:
      // - organizationId (from user context)
      // - formData (current bot customization settings)
      // - Backend must verify user has 'admin' role
      // - Update last_published_at timestamp
      // Example:
      // const response = await fetch('/api/bot-customization/publish', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     organizationId,
      //     property_scope: formData.property_scope,
      //     property_id: formData.selected_property_id,
      //     ...formData
      //   }),
      // });
      
      setTimeout(() => {
        toast({
          title: 'Changes published',
          description: `Bot customization has been published ${
            formData.property_scope === 'all'
              ? 'globally to all properties'
              : 'for the selected property'
          }.`,
        });
        setPublishing(false);
        setShowPublishDialog(false);
      }, 1000);
    } catch (error) {
      console.error('Error publishing changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish changes. Please try again.',
        variant: 'destructive',
      });
      setPublishing(false);
    }
  };

  const handleReset = () => {
    setFormData({
      property_scope: 'all',
      selected_property_id: null,
      greeting_message: DEFAULT_GREETING,
      qualification_questions: DEFAULT_QUALIFICATION_QUESTIONS.map((q, idx) => ({
        ...q,
        id: `default-${idx}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      faqs: [],
      tour_confirmation_message: DEFAULT_TOUR_CONFIRMATION,
      not_qualified_message: DEFAULT_NOT_QUALIFIED,
    });
    setShowResetDialog(false);
    toast({
      title: 'Reset to defaults',
      description: 'All customizations have been reset to default values.',
    });
  };

  return (
    <>
      {/* Role-Based Access Warning - Defense in depth */}
      {!isAdmin && (
        <div className="mb-4">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="font-medium">
              <strong>Access Restricted:</strong> You do not have permission to customize bot settings. 
              Only users with the <strong>Admin</strong> role can edit bot customizations. 
              Contact your organization administrator to request access.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Tabs defaultValue="greeting" className="w-full flex flex-col h-full">
        {/* Tab Navigation - Will be pulled up to header */}
        <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 mb-0">
          <TabsTrigger 
            value="greeting" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Greeting
          </TabsTrigger>
          <TabsTrigger 
            value="questions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Questions
          </TabsTrigger>
          <TabsTrigger 
            value="faqs"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            FAQ Library
          </TabsTrigger>
          <TabsTrigger 
            value="scheduling"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
          >
            <CalendarCheck className="h-4 w-4 mr-2" />
            Scheduling
          </TabsTrigger>
        </TabsList>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
          <div className="border rounded-lg bg-card mt-4">

          <TabsContent value="greeting" className="p-6 space-y-4">
            <GreetingEditor
              message={formData.greeting_message}
              onChange={(message) => setFormData({ ...formData, greeting_message: message })}
              disabled={!isAdmin}
            />
          </TabsContent>

          <TabsContent value="questions" className="p-6 space-y-4">
            <QualificationQuestionsManager
              questions={formData.qualification_questions}
              onChange={(questions) =>
                setFormData({ ...formData, qualification_questions: questions })
              }
              disabled={!isAdmin}
            />
          </TabsContent>

          <TabsContent value="faqs" className="p-6 space-y-4">
            <FAQLibraryManager
              faqs={formData.faqs}
              onChange={(faqs) => setFormData({ ...formData, faqs })}
              disabled={!isAdmin}
            />
          </TabsContent>

          <TabsContent value="scheduling" className="p-6 space-y-4">
            <SchedulingMessagesEditor
              tourConfirmation={formData.tour_confirmation_message}
              notQualified={formData.not_qualified_message}
              onTourConfirmationChange={(message) =>
                setFormData({ ...formData, tour_confirmation_message: message })
              }
              onNotQualifiedChange={(message) =>
                setFormData({ ...formData, not_qualified_message: message })
              }
              disabled={!isAdmin}
            />
          </TabsContent>
          </div>
        </div>

        {/* Fixed Action Buttons - Only visible to Admins */}
        {isAdmin && (
          <div className="border-t bg-background p-4 mt-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                disabled={saving || publishing}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saving || publishing}
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </>
                  )}
                </Button>

                <Button onClick={() => setShowPublishDialog(true)} disabled={saving || publishing}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to default settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore all bot customizations to their default values. Your current
              changes will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Apply these changes to{' '}
              {formData.property_scope === 'all' ? (
                <strong>all properties</strong>
              ) : (
                <strong>the selected property</strong>
              )}
              ? New conversations will use the updated bot configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={publishing}>
              {publishing ? 'Publishing...' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

