import React from 'react';

interface HighlightTextProps {
    text: string;
    keyword?: string;
    className?: string; // Additional class for the wrapper/text
}

export function HighlightText({ text, keyword, className }: HighlightTextProps) {
    if (!text) return null;
    if (!keyword || keyword.trim() === '') {
        return <span className={className}>{text}</span>;
    }

    // Escape special characters in keyword for RegExp
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, index) =>
                part.toLowerCase() === keyword.toLowerCase() ? (
                    <mark key={index} className="bg-yellow-300 text-black px-1 rounded">
                        {part}
                    </mark>
                ) : (
                    <span key={index}>{part}</span>
                )
            )}
        </span>
    );
}
