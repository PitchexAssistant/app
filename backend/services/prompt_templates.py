"""
Advanced Prompt Engineering Templates for Pitch Analysis
Designed by an experienced investor, entrepreneur, and developer

This module contains carefully crafted prompts for various pitch scenarios,
ensuring the LLM stays focused on business coaching and provides actionable feedback.
"""

from typing import Dict, List, Optional
from enum import Enum


class PitchStage(Enum):
    """Different stages of a pitch"""
    INTRODUCTION = "introduction"
    PROBLEM_STATEMENT = "problem"
    SOLUTION = "solution"
    MARKET_OPPORTUNITY = "market"
    BUSINESS_MODEL = "business_model"
    TRACTION = "traction"
    COMPETITION = "competition"
    TEAM = "team"
    FINANCIALS = "financials"
    ASK = "ask"
    CLOSING = "closing"
    OFF_TOPIC = "off_topic"


class PitchType(Enum):
    """Types of pitches"""
    ELEVATOR_PITCH = "elevator"
    INVESTOR_PITCH = "investor"
    SALES_PITCH = "sales"
    PRODUCT_DEMO = "demo"
    NEGOTIATION = "negotiation"


class PromptTemplates:
    """
    Comprehensive prompt templates for pitch coaching
    Based on real investor feedback and successful pitch patterns
    """
    
    # ==================== SYSTEM PROMPTS ====================
    
    MASTER_SYSTEM_PROMPT = """You are an expert pitch coach and seasoned investor with deep experience in:
- Venture capital and startup investing (10+ years)
- Entrepreneurship and business building (founded 3 successful startups)
- Sales and negotiation strategies
- Public speaking and presentation skills

Your role is to provide actionable, investor-focused coaching on business pitches ONLY.

STRICT RULES:
1. ONLY discuss business pitches, entrepreneurship, startups, sales, negotiations, and business presentations
2. If the user discusses anything unrelated to business pitching, politely redirect them back to pitch practice
3. Never engage in casual conversation, personal advice, or non-business topics
4. Always analyze pitches from an investor's perspective
5. Provide specific, measurable, actionable feedback
6. Reference the detected emotions to provide empathetic but professional coaching
7. Focus on: clarity, conviction, data-driven arguments, storytelling, and persuasion

YOUR COACHING STYLE:
- Direct and honest (like a real investor)
- Constructive and encouraging
- Data-driven and strategic
- Focused on ROI and business outcomes
- Emotionally intelligent (acknowledge feelings but stay professional)

Remember: You're preparing entrepreneurs for real investor meetings. Be tough but supportive."""

    OFF_TOPIC_REDIRECT = """I notice you're discussing something that's not related to business pitching or entrepreneurship.

🎯 I'm specifically designed to help you with:
- Investor pitches and fundraising
- Sales presentations
- Business negotiations
- Product demonstrations
- Entrepreneurial storytelling
- Pitch deck feedback
- Communication strategies for business

Let's get back to practicing your pitch! What aspect of your business would you like to present?"""

    # ==================== STAGE-SPECIFIC TEMPLATES ====================
    
    INTRODUCTION_TEMPLATE = """PITCH STAGE: Introduction/Hook
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- Hook effectiveness: Did they grab attention in 3-5 seconds?
- Clarity: Is the company/product name clear?
- Credibility: Did they establish authority?
- Energy: Is the opening compelling?

Provide specific feedback on their introduction. Reference their emotion ({dominant_emotion}) and suggest how to adjust their delivery for maximum impact."""

    PROBLEM_STATEMENT_TEMPLATE = """PITCH STAGE: Problem Statement
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- Problem clarity: Is the pain point crystal clear?
- Market size: Did they quantify the problem?
- Urgency: Is this a "must-solve" or "nice-to-solve" problem?
- Relatability: Can investors understand the problem?
- Data: Are there statistics to back the problem?

As an investor, I need to understand WHY this problem matters. Analyze their problem statement and provide actionable feedback."""

    SOLUTION_TEMPLATE = """PITCH STAGE: Solution Presentation
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- Solution clarity: Is it immediately understandable?
- Differentiation: What makes this unique?
- Feasibility: Does the solution seem realistic?
- Value proposition: Is the benefit clear?
- Demonstration: Did they show, not just tell?

Evaluate their solution presentation. Remember: investors want to see innovation AND execution capability."""

    MARKET_OPPORTUNITY_TEMPLATE = """PITCH STAGE: Market Opportunity
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- TAM/SAM/SOM: Did they provide market sizing?
- Growth trends: Is the market expanding?
- Timing: Why is NOW the right time?
- Target customer: Is the ICP (Ideal Customer Profile) clear?
- Market validation: Any proof points?

Analyze their market opportunity pitch. Investors want to see LARGE, GROWING markets with clear entry strategies."""

    BUSINESS_MODEL_TEMPLATE = """PITCH STAGE: Business Model
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- Revenue streams: How do they make money?
- Pricing strategy: Is it justified and sustainable?
- Unit economics: LTV > CAC?
- Scalability: Can this grow profitably?
- Moat: What prevents competition from copying?

Critique their business model. As an investor, I need to see a PATH TO PROFITABILITY."""

    TRACTION_TEMPLATE = """PITCH STAGE: Traction/Validation
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- Metrics: Revenue, users, growth rate?
- Milestones: What have they achieved?
- Social proof: Customers, partnerships, press?
- Momentum: Is growth accelerating?
- Proof of concept: Does the market validate their idea?

Assess their traction story. TRACTION REDUCES RISK. Help them present their wins effectively."""

    TEAM_TEMPLATE = """PITCH STAGE: Team Introduction
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- Expertise: Why is this team uniquely qualified?
- Completeness: Do they have all key roles covered?
- Track record: Past successes?
- Commitment: Are they full-time?
- Chemistry: Do they work well together?

Evaluate their team pitch. Remember: Early-stage investors often invest in PEOPLE more than ideas."""

    FINANCIALS_TEMPLATE = """PITCH STAGE: Financials
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- Projections: Are they realistic or over-optimistic?
- Key metrics: Burn rate, runway, revenue?
- Assumptions: Are they clearly stated?
- Milestones: What will they achieve with funding?
- ROI: What returns can investors expect?

Analyze their financial pitch. Numbers must be CREDIBLE and DEFENSIBLE."""

    ASK_TEMPLATE = """PITCH STAGE: The Ask (Fundraising)
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- Clarity: Exact amount needed?
- Use of funds: Specific allocation breakdown?
- Valuation: Is it justified?
- Milestones: What will funding achieve?
- Timeline: How long will it last?
- Confidence: Are they asking with authority?

Critique their ask. This is THE MOMENT. They must be clear, confident, and compelling."""

    COMPETITION_TEMPLATE = """PITCH STAGE: Competitive Analysis
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- Awareness: Do they know their competitors?
- Differentiation: What's their unique advantage?
- Competitive matrix: Clear positioning?
- Barriers to entry: What's their moat?
- Honesty: Did they acknowledge real threats?

Evaluate their competitive positioning. Never dismiss competition - acknowledge and differentiate."""

    NEGOTIATION_TEMPLATE = """PITCH TYPE: Negotiation/Sales
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
EMOTION METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

COACHING FOCUS:
- Value proposition: Clear benefits?
- Listening: Are they addressing objections?
- Flexibility: Room for negotiation?
- Confidence: Strong but not aggressive?
- Closing: Clear next steps?

Analyze their negotiation approach. Balance firmness with flexibility."""

    # ==================== EMOTION-SPECIFIC TEMPLATES ====================
    
    HIGH_NERVOUSNESS_COACHING = """
⚠️ NERVOUSNESS ALERT: I detected high nervousness ({nervousness}%) in your delivery.

As an investor, I understand pitch anxiety is natural, but here's what matters:
- Investors invest in CONFIDENT founders
- Nervousness can signal lack of preparation or conviction
- Your emotions are showing - and that's affecting credibility

ACTIONABLE FIXES:
1. Slow down - you're likely speaking too fast
2. Pause between key points for emphasis
3. Use data to anchor yourself (numbers = confidence)
4. Stand/sit up straight - physiology affects psychology
5. Practice this section 10 more times until it feels natural

Remember: You know your business better than anyone. Own it!"""

    LOW_ENTHUSIASM_COACHING = """
🔋 ENERGY CHECK: Your enthusiasm level is {enthusiasm_level}, which may concern investors.

Here's the truth from an investor's perspective:
- If YOU'RE not excited about your business, why should I be?
- Passion is contagious - and so is apathy
- Low energy = red flag about founder commitment

BOOST YOUR ENERGY:
1. Connect to your WHY - why does this matter to you?
2. Use more dynamic language (replace "good" with "transformative")
3. Vary your tone and pace (monotone = boring)
4. Show genuine excitement about your vision
5. Use power words: revolutionary, game-changing, unprecedented

Fake it till you make it? NO. Find the real excitement and let it show!"""

    HIGH_CONFIDENCE_COACHING = """
💪 STRONG DELIVERY: Your confidence indicator is {confidence_indicator} - excellent!

This is exactly what investors want to see. You're demonstrating:
- Strong conviction in your vision
- Preparation and knowledge
- Leadership presence
- Emotional control under pressure

MAINTAIN THIS ENERGY while adding:
1. Data to back up your confidence
2. Acknowledgment of challenges (confidence ≠ arrogance)
3. Specific examples and proof points
4. Clear, measurable claims

You're on the right track. Now make every word count!"""

    # ==================== CONVERSATION CONTEXT TEMPLATES ====================
    
    CONVERSATION_WITH_HISTORY = """You are continuing a pitch coaching session.

CONVERSATION HISTORY:
{conversation_history}

CURRENT STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)
METRICS: Nervousness: {nervousness}%, Enthusiasm: {enthusiasm_level}

Based on the conversation so far:
1. What stage of their pitch are they in?
2. Are they addressing previous feedback?
3. Is their pitch improving or regressing?
4. What's the next logical step in their pitch?

Provide coaching that builds on previous feedback and moves them forward."""

    FIRST_TIME_PITCHER = """FIRST PITCH ANALYSIS
USER'S STATEMENT: {transcript}
DETECTED EMOTION: {dominant_emotion} (Confidence: {confidence}%)

Welcome to pitch coaching! I'm analyzing your first statement.

I'll evaluate:
1. What pitch stage are you starting with?
2. What's working well?
3. What needs immediate improvement?
4. Where should you go next?

Let's build a compelling pitch together. Remember: great pitches are built, not born."""

    # ==================== HELPER METHODS ====================
    
    @staticmethod
    def detect_pitch_stage(transcript: str) -> PitchStage:
        """
        Detect what stage of pitch the user is presenting
        Uses keyword matching and context analysis
        """
        transcript_lower = transcript.lower()
        
        # Keywords for each stage
        stage_keywords = {
            PitchStage.INTRODUCTION: ["hello", "hi", "my name", "we are", "introducing", "company is"],
            PitchStage.PROBLEM_STATEMENT: ["problem", "challenge", "pain point", "struggle", "difficulty", "issue"],
            PitchStage.SOLUTION: ["solution", "solve", "fix", "address", "product", "service", "platform"],
            PitchStage.MARKET_OPPORTUNITY: ["market", "tam", "sam", "som", "opportunity", "industry", "sector", "customers"],
            PitchStage.BUSINESS_MODEL: ["revenue", "pricing", "business model", "monetize", "make money", "subscription"],
            PitchStage.TRACTION: ["traction", "users", "customers", "growth", "revenue", "milestone", "achievement"],
            PitchStage.COMPETITION: ["competitor", "competition", "alternative", "versus", "compared to", "different from"],
            PitchStage.TEAM: ["team", "founder", "co-founder", "ceo", "cto", "experience", "background"],
            PitchStage.FINANCIALS: ["financial", "projection", "forecast", "burn rate", "runway", "profit", "loss"],
            PitchStage.ASK: ["raising", "funding", "investment", "seeking", "round", "valuation", "asking for"],
            PitchStage.CLOSING: ["thank you", "questions", "next steps", "follow up", "contact"],
        }
        
        # Check for off-topic content
        off_topic_keywords = [
            "weather", "sports", "movie", "music", "food", "recipe",
            "travel", "vacation", "hobby", "game", "celebrity",
            "politics", "religion", "personal life", "family", "relationship"
        ]
        
        if any(keyword in transcript_lower for keyword in off_topic_keywords):
            return PitchStage.OFF_TOPIC
        
        # Score each stage
        stage_scores = {}
        for stage, keywords in stage_keywords.items():
            score = sum(1 for keyword in keywords if keyword in transcript_lower)
            stage_scores[stage] = score
        
        # Return stage with highest score, or introduction if tie
        max_score = max(stage_scores.values())
        if max_score == 0:
            return PitchStage.INTRODUCTION
        
        return max(stage_scores, key=stage_scores.get)
    
    @staticmethod
    def is_business_related(transcript: str) -> bool:
        """Check if the transcript is business/pitch related"""
        business_keywords = [
            "business", "company", "startup", "product", "service",
            "customer", "market", "revenue", "sales", "pitch",
            "investor", "funding", "team", "solution", "problem",
            "growth", "scale", "strategy", "model", "value"
        ]
        
        transcript_lower = transcript.lower()
        return any(keyword in transcript_lower for keyword in business_keywords)
    
    @staticmethod
    def get_emotion_coaching(
        dominant_emotion: str,
        confidence: float,
        metrics: Dict
    ) -> str:
        """Get emotion-specific coaching advice"""
        nervousness = metrics.get('nervousness_score', 0)
        enthusiasm_level = metrics.get('enthusiasm_level', 'medium')
        confidence_indicator = metrics.get('confidence_indicator', 'moderate')
        
        coaching = []
        
        # High nervousness
        if nervousness > 0.6:
            coaching.append(PromptTemplates.HIGH_NERVOUSNESS_COACHING.format(
                nervousness=int(nervousness * 100)
            ))
        
        # Low enthusiasm
        if enthusiasm_level == 'low':
            coaching.append(PromptTemplates.LOW_ENTHUSIASM_COACHING.format(
                enthusiasm_level=enthusiasm_level
            ))
        
        # Strong confidence
        if confidence_indicator == 'strong':
            coaching.append(PromptTemplates.HIGH_CONFIDENCE_COACHING.format(
                confidence_indicator=confidence_indicator
            ))
        
        return "\n\n".join(coaching) if coaching else ""
    
    @staticmethod
    def build_prompt(
        transcript: str,
        emotion_data: Dict,
        conversation_history: Optional[List[Dict]] = None,
        force_stage: Optional[PitchStage] = None
    ) -> str:
        """
        Build the complete prompt for the LLM
        This is the main method to use from other services
        """
        # Check if business-related
        if not PromptTemplates.is_business_related(transcript):
            return f"{PromptTemplates.MASTER_SYSTEM_PROMPT}\n\n{PromptTemplates.OFF_TOPIC_REDIRECT}"
        
        # Detect pitch stage
        stage = force_stage or PromptTemplates.detect_pitch_stage(transcript)
        
        # Handle off-topic
        if stage == PitchStage.OFF_TOPIC:
            return f"{PromptTemplates.MASTER_SYSTEM_PROMPT}\n\n{PromptTemplates.OFF_TOPIC_REDIRECT}"
        
        # Extract emotion data
        dominant_emotion = emotion_data.get('dominant_emotion', 'neutral')
        confidence = emotion_data.get('confidence', 0) * 100
        metrics = emotion_data.get('metrics', {})
        nervousness = int(metrics.get('nervousness_score', 0) * 100)
        enthusiasm_level = metrics.get('enthusiasm_level', 'medium')
        confidence_indicator = metrics.get('confidence_indicator', 'moderate')
        
        # Get stage-specific template
        stage_templates = {
            PitchStage.INTRODUCTION: PromptTemplates.INTRODUCTION_TEMPLATE,
            PitchStage.PROBLEM_STATEMENT: PromptTemplates.PROBLEM_STATEMENT_TEMPLATE,
            PitchStage.SOLUTION: PromptTemplates.SOLUTION_TEMPLATE,
            PitchStage.MARKET_OPPORTUNITY: PromptTemplates.MARKET_OPPORTUNITY_TEMPLATE,
            PitchStage.BUSINESS_MODEL: PromptTemplates.BUSINESS_MODEL_TEMPLATE,
            PitchStage.TRACTION: PromptTemplates.TRACTION_TEMPLATE,
            PitchStage.COMPETITION: PromptTemplates.COMPETITION_TEMPLATE,
            PitchStage.TEAM: PromptTemplates.TEAM_TEMPLATE,
            PitchStage.FINANCIALS: PromptTemplates.FINANCIALS_TEMPLATE,
            PitchStage.ASK: PromptTemplates.ASK_TEMPLATE,
        }
        
        stage_template = stage_templates.get(
            stage,
            PromptTemplates.FIRST_TIME_PITCHER
        )
        
        # Format the template
        formatted_template = stage_template.format(
            transcript=transcript,
            dominant_emotion=dominant_emotion,
            confidence=int(confidence),
            nervousness=nervousness,
            enthusiasm_level=enthusiasm_level,
            confidence_indicator=confidence_indicator
        )
        
        # Add emotion-specific coaching
        emotion_coaching = PromptTemplates.get_emotion_coaching(
            dominant_emotion, confidence, metrics
        )
        
        # Add conversation history if available
        if conversation_history and len(conversation_history) > 0:
            history_text = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in conversation_history[-5:]  # Last 5 messages
            ])
            context_template = PromptTemplates.CONVERSATION_WITH_HISTORY.format(
                conversation_history=history_text,
                transcript=transcript,
                dominant_emotion=dominant_emotion,
                confidence=int(confidence),
                nervousness=nervousness,
                enthusiasm_level=enthusiasm_level
            )
            formatted_template = context_template
        
        # Build final prompt
        final_prompt = f"""{PromptTemplates.MASTER_SYSTEM_PROMPT}

{formatted_template}

{emotion_coaching}

Now provide your coaching response. Be specific, actionable, and investor-focused."""
        
        return final_prompt


# ==================== USAGE EXAMPLES ====================

def example_usage():
    """Examples of how to use the prompt templates"""
    
    # Example 1: Problem statement pitch
    transcript = "The biggest problem in the market today is that small businesses struggle with inventory management."
    emotion_data = {
        "dominant_emotion": "neutral",
        "confidence": 0.65,
        "metrics": {
            "nervousness_score": 0.4,
            "enthusiasm_level": "medium",
            "confidence_indicator": "moderate"
        }
    }
    
    prompt = PromptTemplates.build_prompt(transcript, emotion_data)
    print("EXAMPLE 1 - Problem Statement:")
    print(prompt)
    print("\n" + "="*80 + "\n")
    
    # Example 2: Off-topic detection
    transcript = "I went to the movies yesterday and saw a great film."
    prompt = PromptTemplates.build_prompt(transcript, emotion_data)
    print("EXAMPLE 2 - Off-topic:")
    print(prompt)
    print("\n" + "="*80 + "\n")
    
    # Example 3: High nervousness
    transcript = "We're raising 2 million dollars for our AI startup."
    emotion_data = {
        "dominant_emotion": "fear",
        "confidence": 0.45,
        "metrics": {
            "nervousness_score": 0.75,
            "enthusiasm_level": "low",
            "confidence_indicator": "weak"
        }
    }
    
    prompt = PromptTemplates.build_prompt(transcript, emotion_data)
    print("EXAMPLE 3 - High Nervousness:")
    print(prompt)


if __name__ == "__main__":
    example_usage()
