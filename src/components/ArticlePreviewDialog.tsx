import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArticleDetail } from '@/services/api';
import Icon from '@/components/ui/icon';


interface ArticlePreviewDialogProps {
  article: ArticleDetail | null;
  loading: boolean;
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
};

export default function ArticlePreviewDialog({ 
  article, 
  loading, 
  open, 
  onOpenChange 
}: ArticlePreviewDialogProps) {
  // Parse and render MDX content
  const renderContent = () => {
    if (!article || !article.content) {
      return <p className="text-gray-500">Содержимое статьи недоступно</p>;
    }
    
    try {
      // Simple MDX rendering without compilation
      // For proper MDX rendering, you'd need to compile the content first
      // This is a simplified version that handles basic markdown
      const lines = article.content.split('\n');
      const elements: React.ReactNode[] = [];
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];
        
        // Check for HTML blocks (div with align center containing img)
        if (line.trim().startsWith('<div') && line.includes('align="center"')) {
          // Look for the complete div block
          let htmlBlock = line + '\n';
          let j = i + 1;
          
          while (j < lines.length && !lines[j].includes('</div>')) {
            htmlBlock += lines[j] + '\n';
            j++;
          }
          
          if (j < lines.length && lines[j].includes('</div>')) {
            htmlBlock += lines[j];
            
            // Extract image from the HTML block
            const imgMatch = htmlBlock.match(/<img[^>]+>/);
            if (imgMatch) {
              const srcMatch = imgMatch[0].match(/src="([^"]+)"/);
              const altMatch = imgMatch[0].match(/alt="([^"]+)"/);
              const widthMatch = imgMatch[0].match(/width="([^"]+)"/);
              
              if (srcMatch) {
                elements.push(
                  <div key={i} className="flex justify-center mb-4">
                    <img 
                      src={srcMatch[1]} 
                      alt={altMatch ? altMatch[1] : ''} 
                      width={widthMatch ? widthMatch[1] : undefined}
                      className="h-auto rounded-lg"
                    />
                  </div>
                );
              }
            }
            
            i = j + 1;
            continue;
          }
        }
        
        // Headers
        if (line.startsWith('# ')) {
          elements.push(
            <h1 key={i} className="text-3xl font-bold mb-4 mt-8">
              {line.slice(2)}
            </h1>
          );
        } else if (line.startsWith('## ')) {
          elements.push(
            <h2 key={i} className="text-2xl font-semibold mb-3 mt-6">
              {line.slice(3)}
            </h2>
          );
        } else if (line.startsWith('### ')) {
          elements.push(
            <h3 key={i} className="text-xl font-semibold mb-2 mt-4">
              {line.slice(4)}
            </h3>
          );
        } 
        // Images - Markdown format ![alt](url)
        else if (line.match(/!\[([^\]]*)\]\(([^)]+)\)/)) {
          const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
          if (match) {
            const [_, alt, src] = match;
            elements.push(
              <img 
                key={i}
                src={src} 
                alt={alt} 
                className="max-w-full h-auto rounded-lg mb-4 mx-auto"
              />
            );
          }
        }
        // Standalone Images - HTML format
        else if (line.includes('<img') && !line.includes('<div')) {
          const srcMatch = line.match(/src="([^"]+)"/);
          const altMatch = line.match(/alt="([^"]+)"/);
          const widthMatch = line.match(/width="([^"]+)"/);
          if (srcMatch) {
            elements.push(
              <img 
                key={i}
                src={srcMatch[1]} 
                alt={altMatch ? altMatch[1] : ''} 
                width={widthMatch ? widthMatch[1] : undefined}
                className="max-w-full h-auto rounded-lg mb-4 mx-auto"
              />
            );
          }
        }
        // Text with formatting (bold, italic, and/or links)
        else if (line.includes('**') || line.includes('*') || line.includes('[')) {
          const parts: (string | JSX.Element)[] = [];
          let lastIndex = 0;
          let keyCounter = 0;
          
          // Combined regex for links, bold, and italic
          const regex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
          let match;
          
          while ((match = regex.exec(line)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              parts.push(line.substring(lastIndex, match.index));
            }
            
            // Process different match types
            if (match[1]) {
              // Link: [text](url)
              const linkText = match[2];
              const linkUrl = match[3];
              parts.push(
                <a 
                  key={`format-${keyCounter++}`} 
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {linkText}
                </a>
              );
            } else if (match[4]) {
              // Bold text
              parts.push(<strong key={`format-${keyCounter++}`}>{match[5]}</strong>);
            } else if (match[6]) {
              // Italic text
              parts.push(<em key={`format-${keyCounter++}`}>{match[7]}</em>);
            }
            
            lastIndex = match.index + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
          }
          
          elements.push(
            <p key={i} className="mb-4 leading-relaxed">
              {parts.length > 0 ? parts : line}
            </p>
          );
        }
        // Lists
        else if (line.startsWith('- ')) {
          const listContent = line.slice(2);
          
          // Process list item content for links and formatting
          if (listContent.includes('[') || listContent.includes('**') || listContent.includes('*')) {
            const parts: (string | JSX.Element)[] = [];
            let lastIndex = 0;
            let keyCounter = 0;
            
            const regex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
            let match;
            
            while ((match = regex.exec(listContent)) !== null) {
              if (match.index > lastIndex) {
                parts.push(listContent.substring(lastIndex, match.index));
              }
              
              if (match[1]) {
                // Link
                parts.push(
                  <a 
                    key={`list-format-${keyCounter++}`} 
                    href={match[3]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {match[2]}
                  </a>
                );
              } else if (match[4]) {
                // Bold
                parts.push(<strong key={`list-format-${keyCounter++}`}>{match[5]}</strong>);
              } else if (match[6]) {
                // Italic
                parts.push(<em key={`list-format-${keyCounter++}`}>{match[7]}</em>);
              }
              
              lastIndex = match.index + match[0].length;
            }
            
            if (lastIndex < listContent.length) {
              parts.push(listContent.substring(lastIndex));
            }
            
            elements.push(
              <li key={i} className="ml-4">
                {parts}
              </li>
            );
          } else {
            elements.push(
              <li key={i} className="ml-4">
                {listContent}
              </li>
            );
          }
        }
        // Horizontal rule
        else if (line.trim() === '---') {
          elements.push(
            <hr key={i} className="my-8 border-t border-gray-300" />
          );
        }
        // Regular paragraphs
        else if (line.trim() !== '') {
          elements.push(
            <p key={i} className="mb-4 leading-relaxed">
              {line}
            </p>
          );
        }
        
        i++;
      }

      return elements;
    } catch (error) {
      console.error('Error rendering MDX:', error);
      return <pre className="whitespace-pre-wrap">{article.content}</pre>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {article?.title || 'Без названия'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="prose prose-gray max-w-none">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="Loader2" size={32} className="animate-spin text-gray-400" />
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}