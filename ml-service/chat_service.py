"""
Production-Grade AI Chat Assistant for Windchill PLM

Features:
- Natural language understanding with intent detection
- Entity extraction (part numbers, change types)
- Context-aware conversation memory
- Integration with risk analysis ML model
- Action triggering (create ECN, search parts, etc.)
"""

import re
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class PLMChatAssistant:
    """
    AI-powered conversational assistant for PLM operations.
    Uses rule-based NLP with pattern matching and entity extraction.
    """
    
    def __init__(self):
        self.conversation_history = []
        self.context = {}
        
        # Intent patterns for NLP
        self.intents = {
            'risk_analysis': [
                r'\b(risk|impact|affect|consequence|danger)\b',
                r'\bwhat\s+happens\s+if\b',
                r'\b(analyze|assessment|evaluate)\b',
                r'\bobsolet(e|ing)\b',
                r'\b(modify|change|update)\s+(part|component)\b'
            ],
            'greeting': [
                r'\b(hello|hi|hey|good\s+(morning|afternoon|evening))\b'
            ],
            'part_search': [
                r'\b(find|search|look\s+for|show\s+me|get)\s+(part|component)\b',
                r'\bpart\s+(number|id)\b'
            ],
            'change_guidance': [
                r'\bhow\s+to\s+(create|make|start)\b',
                r'\b(ecn|ecr)\s+(process|workflow)\b',
                r'\bwhat\s+is\s+(ecn|ecr)\b'
            ],
            'recommendation': [
                r'\bshould\s+i\b',
                r'\b(recommend|suggest|best\s+way|advice)\b',
                r'\becn\s+(or|vs)\s+ecr\b'
            ]
        }
    
    def chat(self, user_message: str, context: Optional[Dict] = None) -> Dict:
        """
        Main chat interface with intelligent response generation.
        
        Args:
            user_message: User's natural language query
            context: Optional context (current part, change type, etc.)
        
        Returns:
            Dict with reply text, suggestions, and optional actions
        """
        logger.info(f"💬 Incoming: {user_message}")
        
        # Update context
        if context:
            self.context.update(context)
        
        # Add to history
        self.conversation_history.append({
            'role': 'user',
            'message': user_message,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Detect intent
        intent = self._detect_intent(user_message)
        logger.info(f"🎯 Intent: {intent}")
        
        # Extract entities
        entities = self._extract_entities(user_message)
        logger.info(f"🔍 Entities: {entities}")
        
        # Generate intelligent response
        response = self._generate_response(intent, entities, user_message)
        
        # Add to history
        self.conversation_history.append({
            'role': 'assistant',
            'message': response.get('text', ''),
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return response
    
    def _detect_intent(self, message: str) -> str:
        """Detect user intent using pattern matching."""
        message_lower = message.lower()
        
        # Score each intent
        scores = {}
        for intent, patterns in self.intents.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    score += 1
            if score > 0:
                scores[intent] = score
        
        # Return highest scoring intent
        if scores:
            return max(scores, key=scores.get)
        
        return 'general'
    
    def _extract_entities(self, message: str) -> Dict:
        """Extract entities like part numbers, change types."""
        entities = {}
        message_upper = message.upper()
        
        # Extract part numbers
        part_patterns = [
            (r'\b\d{3}[a-zA-Z]{3}\b', 'windchill_pattern'),  # 001dfy
            (r'\b[A-Z]+-\d+\b', 'standard_pattern'),  # MOTOR-123
            (r'\bP\d{6}\b', 'p_pattern')  # P000001
        ]
        
        for pattern, pattern_type in part_patterns:
            matches = re.findall(pattern, message_upper)
            if matches:
                entities['part_number'] = matches[0]
                entities['part_pattern'] = pattern_type
                break
        
        # Extract change types
        change_keywords = {
            'OBSOLETE': ['obsolete', 'obsoleting', 'discontinue'],
            'REVISE': ['revise', 'revision', 'new version'],
            'MODIFY': ['modify', 'change', 'update', 'edit'],
            'DELETE': ['delete', 'remove'],
            'PROMOTE': ['promote', 'release']
        }
        
        for change_type, keywords in change_keywords.items():
            if any(kw in message.lower() for kw in keywords):
                entities['change_type'] = change_type
                break
        
        return entities
    
    def _generate_response(self, intent: str, entities: Dict, user_message: str) -> Dict:
        """Generate intelligent, context-aware response."""
        
        # Greeting
        if intent == 'greeting':
            return {
                'text': "👋 Hello! I'm your AI assistant for Windchill PLM.\n\nI can help you with:\n🔹 **Risk Analysis:** Assess impact of part changes\n🔹 **Process Guidance:** ECN/ECR workflows\n🔹 **Part Search:** Find components in your database\n🔹 **Recommendations:** Best practices for changes\n\nWhat would you like to know?",
                'suggestions': [
                    "Analyze risk for a part",
                    "How to create an ECN?",
                    "Find a part"
                ]
            }
        
        # Risk Analysis
        elif intent == 'risk_analysis':
            part_number = entities.get('part_number') or self.context.get('part_number')
            change_type = entities.get('change_type', 'MODIFY')
            
            if not part_number:
                return {
                    'text': "I'd be happy to analyze the risk! 🔍\n\nWhich part would you like me to analyze?\n\nYou can:\n• Tell me a part number (e.g., '001dfy')\n• Use the part selector above\n• Ask me to search for a part",
                    'suggestions': [
                        "Analyze part 001dfy",
                        "Search for a part",
                        "Show me high-risk parts"
                    ]
                }
            
            # Store context for follow-ups
            self.context['part_number'] = part_number
            self.context['change_type'] = change_type
            
            action_verb = {
                'OBSOLETE': 'obsoleting',
                'REVISE': 'revising',
                'MODIFY': 'modifying',
                'DELETE': 'deleting'
            }.get(change_type, 'changing')
            
            return {
                'text': f"🤖 **Running AI Impact Analysis**\n\nAnalyzing the risk of **{action_verb}** part **{part_number}**...\n\nI'm checking:\n🔹 BOM structure and dependencies\n🔹 Where-used analysis\n🔹 Released parts affected\n🔹 Active conflicts\n🔹 ML-powered risk prediction\n\n*Results will appear on the right* →",
                'actions': ['RUN_IMPACT_ANALYSIS'],
                'action_params': {
                    'part_number': part_number,
                    'change_type': change_type
                },
                'suggestions': [
                    f"What if I {change_type.lower()} this part?",
                    "Show affected assemblies",
                    "How long will this take?"
                ]
            }
        
        # Change Guidance
        elif intent == 'change_guidance':
            if 'ecn' in user_message.lower():
                return {
                    'text': "📖 **Engineering Change Notice (ECN) Process:**\n\n**When to use:**\n• Changing RELEASED parts\n• Formal approval required\n• Multiple stakeholders affected\n\n**Steps:**\n1️⃣ Run impact analysis\n2️⃣ Create ECN with change tasks\n3️⃣ Get manager approval\n4️⃣ Execute change tasks\n5️⃣ Close ECN\n\n**Tip:** Use AI impact analysis to identify all affected parts automatically!",
                    'suggestions': [
                        "Show me ECN template",
                        "How to create ECN?",
                        "ECN vs ECR?"
                    ]
                }
            else:
                return {
                    'text': "📖 **I can help with:**\n\n🔹 **ECN Process** - For released parts\n🔹 **ECR Process** - Change requests\n🔹 **Part Lifecycle** - INWORK → RELEASED\n🔹 **BOM Management** - Structure changes\n\nWhat do you want to learn about?",
                    'suggestions': [
                        "How to create an ECN?",
                        "What is an ECR?",
                        "Part lifecycle explained"
                    ]
                }
        
        # Recommendations
        elif intent == 'recommendation':
            if 'ecn' in user_message.lower() or 'ecr' in user_message.lower():
                return {
                    'text': "🤔 **ECN vs ECR Decision Guide:**\n\n**Use ECN when:**\n✅ Parts are RELEASED\n✅ Formal approval needed\n✅ Production impact\n✅ Multiple parts affected\n\n**Use ECR when:**\n✅ Proposing a change\n✅ Parts are INWORK\n✅ Feasibility study\n✅ Single part, low impact\n\n💡 **Tip:** Run impact analysis first to make the right choice!",
                    'actions': ['SUGGEST_IMPACT_ANALYSIS'],
                    'suggestions': [
                        "Run impact analysis",
                        "Show ECN template",
                        "Find similar changes"
                    ]
                }
            else:
                return {
                    'text': "💡 I can provide recommendations on:\n\n• Which change process to use\n• How to minimize risk\n• Best practices for your situation\n\nWhat decision are you trying to make?",
                    'suggestions': [
                        "Should I use ECN or ECR?",
                        "How to minimize risk?",
                        "Best way to obsolete part?"
                    ]
                }
        
        # Part Search
        elif intent == 'part_search':
            part_number = entities.get('part_number')
            if part_number:
                return {
                    'text': f"🔍 Searching for part **{part_number}**...\n\nUse the part selector above to see full details!",
                    'actions': ['SEARCH_PART'],
                    'action_params': {'part_number': part_number},
                    'suggestions': [
                        f"Analyze {part_number}",
                        "Show me all parts",
                        "Search again"
                    ]
                }
            else:
                return {
                    'text': "🔍 **Part Search**\n\nClick 'Search & Select Part' above to browse your parts database.\n\nOr tell me a part number to search for!",
                    'suggestions': [
                        "Find part 001dfy",
                        "Show all motors",
                        "List RELEASED parts"
                    ]
                }
        
        # General/Fallback
        else:
            return {
                'text': "🤔 I'm not sure I understood that.\n\nI can help you with:\n\n🔹 **Risk Analysis:** 'What's the risk of obsoleting MOTOR-123?'\n🔹 **Guidance:** 'How do I create an ECN?'\n🔹 **Search:** 'Find part 001dfy'\n🔹 **Recommendations:** 'Should I create ECN or ECR?'\n\nTry asking me something!",
                'suggestions': [
                    "What can you do?",
                    "Analyze a part",
                    "Help with changes"
                ]
            }
    
    def clear_context(self):
        """Clear conversation context."""
        self.context = {}
        self.conversation_history = []
        logger.info("🧹 Context cleared")
