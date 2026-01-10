'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import type { FAQ } from '@/types/bot-customization';

interface FAQLibraryManagerProps {
  faqs: FAQ[];
  onChange: (faqs: FAQ[]) => void;
  disabled?: boolean;
}

export function FAQLibraryManager({
  faqs,
  onChange,
  disabled = false,
}: FAQLibraryManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
  });

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setEditingFAQ(null);
    setFormData({ question: '', answer: '' });
    setDialogOpen(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.question.trim() || !formData.answer.trim()) return;

    if (editingFAQ) {
      onChange(
        faqs.map((f) =>
          f.id === editingFAQ.id
            ? {
                ...f,
                question: formData.question,
                answer: formData.answer,
                last_updated: new Date().toISOString(),
              }
            : f
        )
      );
    } else {
      const newFAQ: FAQ = {
        id: `faq-${Date.now()}`,
        question: formData.question,
        answer: formData.answer,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      onChange([...faqs, newFAQ]);
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setFaqToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (faqToDelete) {
      onChange(faqs.filter((f) => f.id !== faqToDelete));
    }
    setDeleteDialogOpen(false);
    setFaqToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {!disabled && (
          <Button onClick={handleAdd} size="default">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        )}
      </div>

      {filteredFaqs.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'No FAQs found matching your search.'
              : 'No FAQs yet'}
          </p>
          {!disabled && !searchQuery && (
            <Button onClick={handleAdd} variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Your First FAQ
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="p-5 border rounded-lg hover:bg-muted/30 transition-colors bg-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-2">
                    <h4 className="font-semibold text-base">{faq.question}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span>
                      Last updated: {new Date(faq.last_updated).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                    {faq.property_id && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          Property-specific
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {!disabled && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(faq)}
                      className="h-9 w-9"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(faq.id)}
                      className="text-destructive hover:text-destructive h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
            <DialogDescription>
              Add frequently asked questions and their answers to help the bot respond quickly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="faq-question">Question *</Label>
              <Input
                id="faq-question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="e.g., Do you allow pets?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faq-answer">Answer *</Label>
              <Textarea
                id="faq-answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={5}
                placeholder="e.g., Yes, we allow pets with a $200 pet deposit and $50 monthly pet rent."
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.question.trim() || !formData.answer.trim()}
            >
              {editingFAQ ? 'Update' : 'Add'} FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this FAQ from your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
