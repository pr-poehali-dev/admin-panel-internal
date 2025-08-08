import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MDXProvider } from '@mdx-js/react';
import { ArticleListItem } from '@/services/api';
import Icon from '@/components/ui/icon';
import { AccordionGroup, AccordionSimple as Accordion } from '@/components/ui/accordion';

interface ArticlePreviewDialogProps {
  article: ArticleListItem | null;
  content: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// MDX components mapping
const mdxComponents = {
  h1: (props: any) => <h1 className="text-3xl font-bold mb-4 mt-8" {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-semibold mb-3 mt-6" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-semibold mb-2 mt-4" {...props} />,
  p: (props: any) => <p className="mb-4 leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
  li: (props: any) => <li className="ml-4" {...props} />,
  strong: (props: any) => <strong className="font-semibold" {...props} />,
  em: (props: any) => <em className="italic" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 py-2 mb-4 italic" {...props} />
  ),
  code: (props: any) => {
    if (props.className) {
      return <code className="block bg-gray-100 p-4 rounded-md mb-4 overflow-x-auto" {...props} />;
    }
    return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />;
  },
  pre: (props: any) => <pre className="bg-gray-100 p-4 rounded-md mb-4 overflow-x-auto" {...props} />,
  img: (props: any) => (
    <img className="max-w-full h-auto rounded-lg mb-4 mx-auto" {...props} />
  ),
  a: (props: any) => (
    <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
  ),
  hr: () => <hr className="my-8 border-gray-300" />,
  table: (props: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-gray-300" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left font-semibold" {...props} />
  ),
  td: (props: any) => (
    <td className="border border-gray-300 px-4 py-2" {...props} />
  ),
  AccordionGroup,
  Accordion,
};

export default function ArticlePreviewDialog({ 
  article, 
  content, 
  open, 
  onOpenChange 
}: ArticlePreviewDialogProps) {
  // Parse and render MDX content
  const renderContent = () => {
    try {
      // Simple MDX rendering without compilation
      // For proper MDX rendering, you'd need to compile the content first
      // This is a simplified version that handles basic markdown
      const lines = content.split('\n');
      const elements: React.ReactNode[] = [];
      let currentIndex = 0;

      lines.forEach((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          elements.push(
            <h1 key={index} className="text-3xl font-bold mb-4 mt-8">
              {line.slice(2)}
            </h1>
          );
        } else if (line.startsWith('## ')) {
          elements.push(
            <h2 key={index} className="text-2xl font-semibold mb-3 mt-6">
              {line.slice(3)}
            </h2>
          );
        } else if (line.startsWith('### ')) {
          elements.push(
            <h3 key={index} className="text-xl font-semibold mb-2 mt-4">
              {line.slice(4)}
            </h3>
          );
        } 
        // Images
        else if (line.includes('<img')) {
          const srcMatch = line.match(/src="([^"]+)"/);
          const altMatch = line.match(/alt="([^"]+)"/);
          if (srcMatch) {
            elements.push(
              <img 
                key={index}
                src={srcMatch[1]} 
                alt={altMatch ? altMatch[1] : ''} 
                className="max-w-full h-auto rounded-lg mb-4 mx-auto"
              />
            );
          }
        }
        // Bold text
        else if (line.includes('**')) {
          const parts = line.split('**');
          const formatted = parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          );
          elements.push(
            <p key={index} className="mb-4 leading-relaxed">
              {formatted}
            </p>
          );
        }
        // Lists
        else if (line.startsWith('- ')) {
          elements.push(
            <li key={index} className="ml-4">
              {line.slice(2)}
            </li>
          );
        }
        // Regular paragraphs
        else if (line.trim() !== '') {
          elements.push(
            <p key={index} className="mb-4 leading-relaxed">
              {line}
            </p>
          );
        }
      });

      return elements;
    } catch (error) {
      console.error('Error rendering MDX:', error);
      return <pre className="whitespace-pre-wrap">{content}</pre>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Предпросмотр: {article?.title || 'Без названия'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="prose prose-gray max-w-none">
            {renderContent()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}