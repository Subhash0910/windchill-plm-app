"""
Production-Grade Context-Aware AI Chat Assistant for Windchill PLM

Features:
- Strict scope enforcement (PLM-only queries)
- Natural language understanding with intent detection
- Context-aware responses based on UI state
- Entity extraction (part numbers, change types)
- Session memory and conversation continuity
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
    Uses rule-based NLP with pattern matching, entity extraction, and strict scope validation.
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
            ],
            'bom_query': [
                r'\b(bom|bill\s+of\s+materials|structure)\b',
                r'\b(assembly|sub(\-)?assembly|component|child|parent)\b'
            ],
            'lifecycle': [
                r'\b(lifecycle|state|status|phase)\b',
                r'\b(inwork|released|under\s+review|obsolete)\b'
            ]
        }
        
        # Out-of-scope keywords (questions to reject)
        self.out_of_scope_keywords = [
            r'\b(weather|temperature|climate|forecast)\b',
            r'\b(cook|recipe|food|restaurant)\b',
            r'\b(movie|film|tv\s+show|actor)\b',
            r'\b(sports?|game|match|player|team)\s+(?!part)',  # but allow 'team' in PLM context
            r'\b(math|calculate|equation|solve)\s+(?!risk)',  # but allow 'calculate risk'
            r'\b(news|politics|election|president)\b',
            r'\b(stock|investment|bitcoin|crypto)\b',
            r'\b(health|medical|doctor|disease)\b',
            r'\b(translate|translation|language)\s+(?!change)',  # but allow 'change' context
        ]
    
    def chat(self, user_message: str, context: Optional[Dict] = None) -> Dict:
        """
        Main chat interface with intelligent response generation.
        
        Args:
            user_message: User's natural language query
            context: Optional UI context (current page, selected part, change type, etc.)
        
        Returns:
            Dict with reply text, suggestions, and optional actions
        """
        logger.info(f"💬 Incoming: {user_message}")
        
        # Update context from UI state
        if context:
            self.context.update(context)
            logger.info(f"🗺️ Context: page={context.get('page')}, part={context.get('selected_part', {}).get('part_number')}")
        
        # Add to history
        self.conversation_history.append({
            'role': 'user',
            'message': user_message,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # SCOPE VALIDATION - Check if query is PLM-related
        if not self._is_plm_related(user_message):
            logger.warning(f"❌ Out of scope query detected")
            response = self._generate_out_of_scope_response()
            self.conversation_history.append({
                'role': 'assistant',
                'message': response.get('text', ''),
                'timestamp': datetime.utcnow().isoformat()
            })
            return response
        
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
    
    def _is_plm_related(self, message: str) -> bool:
        """
        Check if query is PLM-related. Returns False for off-topic questions.
        """
        message_lower = message.lower()
        
        # Check for out-of-scope keywords
        for pattern in self.out_of_scope_keywords:
            if re.search(pattern, message_lower):
                return False
        
        # PLM-related keywords
        plm_keywords = [
            r'\b(part|component|assembly|product)\b',
            r'\b(ecn|ecr|change|revision)\b',
            r'\b(bom|bill\s+of\s+materials)\b',
            r'\b(lifecycle|state|status|workflow)\b',
            r'\b(risk|impact|analysis|obsolete)\b',
            r'\b(windchill|plm)\b',
            r'\b(engineer|design|manufacture)\b',
            r'\b(released|inwork|under\s+review)\b',
            r'\b(approve|reject|promote)\b',
        ]
        
        # If contains PLM keywords, it's in scope
        for pattern in plm_keywords:
            if re.search(pattern, message_lower):
                return True
        
        # Check intents - if any PLM intent detected, it's in scope
        for intent, patterns in self.intents.items():
            if intent == 'greeting':
                continue  # greetings are always OK
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return True
        
        # Very short queries are ambiguous - check context
        if len(message.split()) <= 3:
            # If we have part context, assume it's PLM-related
            if self.context.get('selected_part'):
                return True
            # If last query was PLM-related, assume continuation
            if len(self.conversation_history) > 0:
                return True
        
        # Default: reject
        return False
    
    def _generate_out_of_scope_response(self) -> Dict:
        """
        Generate polite rejection for out-of-scope queries.
        """
        return {
            'text': "🤔 I'm your **Windchill PLM assistant** - I can only help with PLM-related tasks.\n\n**I can help with:**\n✅ Part impact analysis and risk assessment\n✅ Change management (ECN/ECR processes)\n✅ BOM structure and where-used queries\n✅ Lifecycle workflow guidance\n✅ Part search and information\n\n**I cannot help with:**\n❌ General knowledge questions\n❌ Weather, news, or entertainment\n❌ Math, translation, or other non-PLM tasks\n\n**Try asking:**\n• 'What's the risk of obsoleting part XYZ?'\n• 'How do I create an ECN?'\n• 'Show me BOM for this part'\n• 'What's the lifecycle of released parts?'",
            'suggestions': [
                "Analyze a part's risk",
                "How to create an ECN?",
                "What can you help with?"
            ]
        }
    
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
        
        # Get context from UI state
        selected_part = self.context.get('selected_part')
        current_page = self.context.get('page', 'unknown')
        ui_change_type = self.context.get('change_type')
        
        # Greeting
        if intent == 'greeting':
            return {
                'text': f"👋 Hello! I'm your AI assistant for Windchill PLM.\n\n**Current context:**\n📍 Page: {current_page}" + (
                    f"\n🔧 Selected part: {selected_part['part_number']} ({selected_part['lifecycle_state']})" if selected_part else ""
                ) + "\n\n**I can help you with:**\n🔹 Risk Analysis\n🔹 Process Guidance (ECN/ECR)\n🔹 Part Search\n🔹 BOM Queries\n\nWhat would you like to know?",
                'suggestions': [
                    "Analyze this part" if selected_part else "Analyze a part",
                    "How to create an ECN?",
                    "What can you do?"
                ]
            }
        
        # Risk Analysis with CONTEXT AWARENESS
        elif intent == 'risk_analysis':
            # Try to get part from entities, then from UI context
            part_number = entities.get('part_number') or (selected_part['part_number'] if selected_part else None)
            change_type = entities.get('change_type') or ui_change_type or 'MODIFY'
            
            if not part_number:
                return {
                    'text': "I'd be happy to analyze the risk! 🔍\n\n" + (
                        "You're on the AI Demo page - click 'Search & Select Part' above to choose a part." if current_page == 'ai-demo' else
                        "Which part would you like me to analyze?\n\nYou can:\n• Tell me a part number (e.g., '001dfy')\n• Select a part from the list\n• Ask me to search for a part"
                    ),
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
                'text': f"🤖 **Running AI Impact Analysis**\n\nAnalyzing the risk of **{action_verb}** part **{part_number}**...\n\nI'm checking:\n🔹 BOM structure and dependencies\n🔹 Where-used analysis (parent assemblies)\n🔹 Released parts affected\n🔹 Active conflicting changes\n🔹 ML-powered risk prediction\n\n*Results will appear on the right* →",
                'actions': ['RUN_IMPACT_ANALYSIS'],
                'action_params': {
                    'part_number': part_number,
                    'change_type': change_type
                },
                'suggestions': [
                    f"What if I {change_type.lower()} this part?",
                    "Show affected assemblies",
                    "How to minimize risk?"
                ]
            }
        
        # Continue with other intents...
        elif intent == 'change_guidance':
            if 'ecn' in user_message.lower():
                return {
                    'text': "📖 **Engineering Change Notice (ECN) Process:**\n\n**When to use:**\n• Changing RELEASED parts\n• Formal approval required\n• Multiple stakeholders affected\n\n**Steps:**\n1️⃣ Run impact analysis\n2️⃣ Create ECN with change tasks\n3️⃣ Get manager approval\n4️⃣ Execute change tasks\n5️⃣ Close ECN\n\n**Tip:** Use AI impact analysis to identify all affected parts automatically!",
                    'suggestions': [
                        "Show me ECN template",
                        "ECN vs ECR?",
                        "How to approve ECN?"
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
        
        elif intent == 'part_search':
            part_number = entities.get('part_number')
            if part_number:
                return {
                    'text': f"🔍 Searching for part **{part_number}**...\n\n" + (
                        "Use the 'Search & Select Part' button above to see full details!" if current_page == 'ai-demo' else
                        "You can use the part search feature to find it!"
                    ),
                    'actions': ['SEARCH_PART'],
                    'action_params': {'part_number': part_number},
                    'suggestions': [
                        f"Analyze {part_number}",
                        "Show all parts",
                        "Search again"
                    ]
                }
            else:
                return {
                    'text': "🔍 **Part Search**" + (
                        "\n\nClick 'Search & Select Part' above to browse your parts database." if current_page == 'ai-demo' else
                        "\n\nUse the parts page to browse your database."
                    ) + "\n\nOr tell me a part number to search for!",
                    'suggestions': [
                        "Find part 001dfy",
                        "Show all parts",
                        "List RELEASED parts"
                    ]
                }
        
        # BOM Query
        elif intent == 'bom_query':
            if selected_part:
                return {
                    'text': f"🔍 **BOM Query for {selected_part['part_number']}**\n\nThis feature will show:\n• Child components (BOM structure)\n• Parent assemblies (where-used)\n• Quantity and relationships\n\n*BOM visualization coming soon!*",
                    'suggestions': [
                        "Show where-used",
                        "Analyze this part",
                        "View part details"
                    ]
                }
            else:
                return {
                    'text': "🔍 **BOM (Bill of Materials) Query**\n\nI can help you explore:\n• Part hierarchies\n• Assembly structures\n• Where-used analysis\n\nWhich part would you like to explore?",
                    'suggestions': [
                        "Select a part first",
                        "What is BOM?",
                        "Show me example"
                    ]
                }
        
        # General/Fallback
        else:
            context_hint = f"\n\n**Current context:**\n📍 {current_page} page" + (
                f"\n🔧 {selected_part['part_number']} selected" if selected_part else ""
            )
            
            return {
                'text': "🤔 I'm not sure I understood that." + context_hint + "\n\n**I can help you with:**\n\n🔹 **Risk Analysis:** 'What's the risk of obsoleting MOTOR-123?'\n🔹 **Guidance:** 'How do I create an ECN?'\n🔹 **Search:** 'Find part 001dfy'\n🔹 **Recommendations:** 'Should I create ECN or ECR?'\n\nTry asking me something!",
                'suggestions': [
                    "What can you do?",
                    "Analyze a part" if not selected_part else f"Analyze {selected_part['part_number']}",
                    "Help with changes"
                ]
            }
    
    def clear_context(self):
        """Clear conversation context."""
        self.context = {}
        self.conversation_history = []
        logger.info("🧹 Context cleared")
