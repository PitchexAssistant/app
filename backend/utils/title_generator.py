"""
Session Title Generator
Auto-generates descriptive titles from conversation content (Gemini-style)
"""

import re
import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class TitleGenerator:
    """Generates descriptive session titles from chat content."""
    
    # Common filler words to remove
    FILLER_WORDS = {'um', 'uh', 'like', 'you', 'know', 'basically', 'actually', 'just', 'really', 'very'}
    
    # Stop words to ignore in keyword extraction
    STOP_WORDS = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
        'with', 'is', 'are', 'was', 'were', 'i', 'me', 'my', 'we', 'our', 'your',
        'this', 'that', 'these', 'those', 'am', 'been', 'being', 'have', 'has', 
        'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can',
        'it', 'its', 'from', 'by', 'about', 'into', 'through', 'during', 'before',
        'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
        'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
        'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will'
    }
    
    # Profanity filter (basic list - expand as needed)
    PROFANITY_LIST = {'damn', 'hell', 'shit', 'fuck', 'ass', 'bitch'}
    
    MAX_TITLE_LENGTH = 50
    
    def __init__(self, gemini_service=None):
        """Initialize with optional Gemini service for LLM-based extraction."""
        self.gemini_service = gemini_service
    
    async def generate_from_message(
        self, 
        message: str,
        mode: str = "pitch",
        max_words: int = 5
    ) -> str:
        """
        Generate title from user's first message.
        
        Args:
            message: First user message
            mode: Session mode (pitch, qa, negotiation)
            max_words: Maximum words in title (default: 5)
            
        Returns:
            Generated title (e.g., "Live Session: SaaS product market")
        """
        try:
            # Clean message
            cleaned = self._clean_message(message)
            
            if len(cleaned) < 10:
                # Too short, use fallback
                return self._fallback_title(mode)
            
            # Try LLM extraction if service available
            if self.gemini_service:
                try:
                    title_keywords = await self._extract_keywords_llm(cleaned, max_words)
                    if title_keywords:
                        final_title = f"Live Session: {title_keywords}"
                        return self._sanitize_title(final_title)
                except Exception as e:
                    logger.warning(f"LLM title extraction failed: {e}")
            
            # Fallback to rule-based extraction
            return self._fallback_title_from_text(cleaned, max_words)
                
        except Exception as e:
            logger.error(f"Title generation failed: {e}")
            return self._fallback_title(mode)
    
    async def _extract_keywords_llm(self, text: str, max_words: int) -> Optional[str]:
        """Use Gemini to extract key topics."""
        prompt = f"""Extract {max_words} key words or short phrases from this message.
Focus on what the person is talking about - the main topic or subject.
Be concise and specific.

Message: "{text[:500]}"

Respond with ONLY the keywords, separated by spaces. No punctuation except hyphens in compound words.
Example responses:
- "AI recruiting platform startups"
- "SaaS product market-fit strategy"
- "mobile app user retention"

Keywords:"""
        
        try:
            response = await self.gemini_service.generate_text(
                prompt=prompt,
                temperature=0.3,  # Lower temperature for consistency
                max_tokens=30
            )
            
            keywords = response.strip()
            
            # Validate response
            word_count = len(keywords.split())
            if 2 <= word_count <= max_words + 2:
                return keywords
            else:
                return None
                
        except Exception as e:
            logger.error(f"LLM extraction error: {e}")
            return None
    
    def _clean_message(self, message: str) -> str:
        """Remove filler words and normalize text."""
        if not message:
            return ""
        
        # Convert to lowercase for processing
        text = message.lower()
        
        # Remove common filler words
        words = text.split()
        cleaned_words = []
        
        for word in words:
            # Remove punctuation for comparison
            clean_word = re.sub(r'[^\w\s-]', '', word)
            if clean_word and clean_word not in self.FILLER_WORDS:
                cleaned_words.append(word)  # Keep original case
        
        # Rejoin and clean up spaces
        cleaned = ' '.join(cleaned_words)
        cleaned = ' '.join(cleaned.split())  # Normalize whitespace
        
        return cleaned
    
    def _fallback_title_from_text(self, text: str, max_words: int) -> str:
        """Rule-based keyword extraction if LLM fails."""
        words = text.split()
        keywords = []
        
        for word in words:
            if len(keywords) >= max_words:
                break
            
            # Remove punctuation
            clean_word = re.sub(r'[^\w\s-]', '', word.lower())
            
            # Keep if not stop word and meaningful length
            if clean_word not in self.STOP_WORDS and len(clean_word) > 2:
                # Capitalize first letter
                keywords.append(clean_word.capitalize())
        
        if keywords:
            title = f"Live Session: {' '.join(keywords)}"
            return self._sanitize_title(title)
        else:
            return self._fallback_title("pitch")
    
    def _fallback_title(self, mode: str) -> str:
        """Final fallback with timestamp."""
        time_str = datetime.now().strftime("%b %d, %I:%M %p")
        mode_map = {
            "pitch": "Pitch Practice",
            "qa": "Q&A Session",
            "negotiation": "Negotiation Practice"
        }
        mode_name = mode_map.get(mode, "Practice")
        return f"Live Session: {mode_name} - {time_str}"
    
    def _sanitize_title(self, title: str) -> str:
        """Remove inappropriate content, special chars, and limit length."""
        # Check for profanity
        lower_title = title.lower()
        for word in self.PROFANITY_LIST:
            if word in lower_title:
                return "Live Session: Practice"
        
        # Remove excessive special characters (keep letters, numbers, spaces, hyphens, colons)
        title = re.sub(r'[^\w\s:-]', '', title)
        
        # Normalize spaces
        title = ' '.join(title.split())
        
        # Limit length
        if len(title) > self.MAX_TITLE_LENGTH:
            title = title[:self.MAX_TITLE_LENGTH].rsplit(' ', 1)[0] + "..."
        
        return title
    
    def ensure_unique_title(self, title: str, existing_titles: list) -> str:
        """Append (2), (3) etc if title exists."""
        if title not in existing_titles:
            return title
        
        counter = 2
        while f"{title} ({counter})" in existing_titles:
            counter += 1
        
        return f"{title} ({counter})"
