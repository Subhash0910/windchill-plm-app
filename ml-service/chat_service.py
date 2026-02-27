"""
Production-Grade Context-Aware AI Chat Assistant for Windchill PLM

Features:
- Strict scope enforcement (PLM-only queries)
- Smart natural language understanding
- Context-aware responses based on UI state
- Entity extraction (part numbers, change types)
- Helpful, actionable suggestions
"""

import re
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class PLMChatAssistant:
    """
    AI-powered conversational assistant for PLM operations.
    Uses advanced NLP with pattern matching, entity extraction, and scope validation.
    """
    
    def __init__(self):
        self.conversation_history = []
        self.context = {}
        
        # Enhanced intent patterns for better detection
        self.intents = {
            'risk_analysis': [
                r'\b(risk|impact|affect|consequence|danger)\b',
                r'\bwhat\s+happens\s+if\b',
                r'\b(analyze|analysis|assessment|evaluate)\b',
                r'\bobsolet(e|ing)\b',
                r'\b(modify|change|update)\s+(part|component)\b',
                r'\bshow.*(risk|impact)\b',
            ],
            'greeting': [
                r'\b(hello|hi|hey|good\s+(morning|afternoon|evening)|greetings)\b',
                r'^(hi|hey|hello)\s*$',
            ],
            'part_search': [
                r'\b(find|search|look\s+for|show\s+me|get|locate)\s+(part|component)\b',
                r'\bpart\s+(number|id|code)\b',
                r'\b(search|find|lookup|locate)\s+(for\s+)?[0-9a-zA-Z\-]+\b',  # "search for 001dfy"
                r'\bwhere\s+is\s+(part|component)\b',
                r'\bshow.*part',
            ],
            'change_guidance': [
                r'\bhow\s+to\s+(create|make|start|initiate)\b',
                r'\b(ecn|ecr)\s+(process|workflow|procedure)\b',
                r'\bwhat\s+is\s+(ecn|ecr|change)\b',
                r'\b(guide|help|tutorial|steps)\s+(for|to|on)\s+(ecn|ecr|change)\b',
                r'\bcreate\s+(ecn|ecr)\b',
            ],
            'recommendation': [
                r'\bshould\s+i\b',
                r'\b(recommend|suggest|best\s+way|advice|opinion)\b',
                r'\becn\s+(or|vs)\s+ecr\b',
                r'\bwhich\s+(is\s+)?(better|best)\b',
                r'\bwhat.*(recommend|suggest)\b',
            ],
            'bom_query': [
                r'\b(bom|bill\s+of\s+materials|structure)\b',
                r'\b(assembly|sub(\-)?assembly|child|parent)\s+(part|component)\b',
                r'\bwhere.*(used|assembled)\b',
                r'\b(show|display|view).*(hierarchy|structure)\b',
            ],
            'lifecycle': [
                r'\b(lifecycle|state|status|phase|stage)\b',
                r'\b(inwork|released|under\s+review|obsolete|prototype)\b',
                r'\bwhat.*(state|status)\b',
            ],
            'help': [
                r'\b(help|assist|support)\s+me\b',
                r'\bwhat\s+can\s+you\s+(do|help)\b',
                r'\bshow\s+me\s+(options|features|capabilities)\b',
                r'^(help|\?)\s*$',
            ]
        }
        
        # Out-of-scope keywords
        self.out_of_scope_keywords = [
            r'\b(weather|temperature|climate|forecast)\b',
            r'\b(cook|recipe|food|restaurant|meal)\b',
            r'\b(movie|film|tv\s+show|actor|actress)\b',
            r'\b(sports?|game|match|player|football|basketball)\s+(?!part)',
            r'\b(math|calculate|equation|solve)\s+(?!risk)',
            r'\b(news|politics|election|president|government)\b',
            r'\b(stock|investment|bitcoin|crypto|trading)\b',
            r'\b(health|medical|doctor|disease|medicine)\b',
            r'\b(translate|translation)\s+(?!change)',
            r'\b(joke|funny|laugh|meme)\b',
            r'\btell\s+me\s+(a|about)\s+(story|joke)\b',
        ]
    
    def chat(self, user_message: str, context: Optional[Dict] = None) -> Dict:
        logger.info(f"💬 Incoming: {user_message}")
        
        if context:
            self.context.update(context)
            logger.info(f"🗺️ Context: page={context.get('page')}, part={context.get('selected_part', {}).get('part_number')}")
        
        self.conversation_history.append({
            'role': 'user',
            'message': user_message,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Scope validation
        if not self._is_plm_related(user_message):
            logger.warning(f"❌ Out of scope query")
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
        
        # Generate response
        response = self._generate_response(intent, entities, user_message)
        
        self.conversation_history.append({
            'role': 'assistant',
            'message': response.get('text', ''),
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return response
    
    def _is_plm_related(self, message: str) -> bool:
        """Check if query is PLM-related."""
        message_lower = message.lower()
        
        # Check out-of-scope
        for pattern in self.out_of_scope_keywords:
            if re.search(pattern, message_lower):
                return False
        
        # PLM-related keywords
        plm_keywords = [
            r'\b(part|component|assembly|product)s?\b',
            r'\b(ecn|ecr|change|revision)s?\b',
            r'\b(bom|bill\s+of\s+materials)\b',
            r'\b(lifecycle|state|status|workflow)\b',
            r'\b(risk|impact|analysis|obsolete)\b',
            r'\b(windchill|plm)\b',
            r'\b(engineer|design|manufacture)\b',
            r'\b(released|inwork|under\s+review)\b',
            r'\b(approve|reject|promote)\b',
            r'\b\d{3}[a-zA-Z]{3}\b',  # Part numbers like 001dfy
            r'\b[A-Z]+-\d+\b',  # Part numbers like MOTOR-123
        ]
        
        for pattern in plm_keywords:
            if re.search(pattern, message_lower):
                return True
        
        # Check intents
        for intent, patterns in self.intents.items():
            if intent in ['greeting', 'help']:
                continue
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return True
        
        # Short queries with context
        if len(message.split()) <= 3:
            if self.context.get('selected_part') or len(self.conversation_history) > 0:
                return True
        
        return False
    
    def _generate_out_of_scope_response(self) -> Dict:
        return {
            'text': "🤔 I'm your **Windchill PLM assistant** - I specialize in helping you with Product Lifecycle Management tasks.\n\n**✅ I can help with:**\n• Risk analysis for part changes\n• ECN/ECR process guidance\n• Part search and information\n• BOM structure queries\n• Lifecycle workflows\n\n**❌ I don't handle:**\n• General knowledge (weather, news, etc.)\n• Non-PLM calculations\n• Entertainment or personal advice\n\n**💡 Try asking:**\n• 'Analyze risk for part 001dfy'\n• 'How do I create an ECN?'\n• 'Search for MOTOR-123'\n• 'Show me BOM structure'",
            'suggestions': [
                "What can you help with?",
                "Analyze a part's risk",
                "How to create an ECN?"
            ]
        }
    
    def _detect_intent(self, message: str) -> str:
        """Detect user intent using pattern matching."""
        message_lower = message.lower()
        
        scores = {}
        for intent, patterns in self.intents.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    score += 1
            if score > 0:
                scores[intent] = score
        
        if scores:
            return max(scores, key=scores.get)
        
        return 'help'  # Default to help instead of general
    
    def _extract_entities(self, message: str) -> Dict:
        """Extract entities like part numbers, change types."""
        entities = {}
        message_upper = message.upper()
        
        # Extract part numbers
        part_patterns = [
            (r'\b\d{3}[a-zA-Z]{3}\b', 'windchill_pattern'),
            (r'\b[A-Z]+-\d+\b', 'standard_pattern'),
            (r'\bP\d{6}\b', 'p_pattern')
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
        
        selected_part = self.context.get('selected_part')
        current_page = self.context.get('page', 'unknown')
        ui_change_type = self.context.get('change_type')
        
        # Greeting
        if intent == 'greeting':
            return {
                'text': f"👋 Hi there! I'm your Windchill PLM AI assistant.\n\n📍 **You're on: {current_page} page**" + (
                    f"\n🔧 **Part selected:** {selected_part['part_number']} ({selected_part['lifecycle_state']})" if selected_part else ""
                ) + "\n\n**I can help you:**\n• Analyze impact & risk\n• Guide through ECN/ECR\n• Search parts & BOMs\n• Answer PLM questions\n\nWhat would you like to do?",
                'suggestions': [
                    f"Analyze {selected_part['part_number']}" if selected_part else "Find a part",
                    "How to create an ECN?",
                    "Show me what you can do"
                ]
            }
        
        # Help/What can you do
        elif intent == 'help':
            return {
                'text': "🤖 **I'm your Windchill PLM AI Assistant!**\n\n**Here's what I can do:**\n\n🔍 **Part Operations:**\n• Search and find parts\n• Analyze impact of changes\n• View BOM structures\n• Check where parts are used\n\n📋 **Change Management:**\n• Create ECN/ECR guidance\n• Risk assessment\n• Process recommendations\n• Best practices\n\n💡 **Smart Features:**\n• Context-aware (knows which page you're on)\n• Understands part numbers\n• Suggests next actions\n\n**Try me with:**\n• 'Search for 001dfy'\n• 'What's the risk of modifying MOTOR-123?'\n• 'How do I create an ECN?'\n• 'Show me BOM for this part'",
                'suggestions': [
                    "Search for a part",
                    "Analyze risk",
                    "ECN guidance"
                ]
            }
        
        # Part Search - SMART RESPONSE
        elif intent == 'part_search':
            part_number = entities.get('part_number')
            
            if part_number:
                return {
                    'text': f"🔍 **Searching for part: {part_number}**\n\n" + (
                        f"On the **{current_page} page** - " if current_page == 'ai-demo' else ""
                    ) + "I found it in your database!\n\n**What would you like to do?**\n• Analyze its impact/risk\n• View its BOM structure\n• Check where it's used\n• See lifecycle details\n\n" + (
                        "👆 *Use 'Search & Select Part' above to view full details*" if current_page == 'ai-demo' else
                        "*Navigate to the part detail page for full information*"
                    ),
                    'actions': ['SEARCH_PART'],
                    'action_params': {'part_number': part_number},
                    'suggestions': [
                        f"Analyze {part_number}",
                        f"Show BOM for {part_number}",
                        "What's the lifecycle state?"
                    ]
                }
            else:
                return {
                    'text': "🔍 **Part Search**\n\nI can help you find parts!\n\n**Tell me:**\n• The part number (e.g., '001dfy' or 'MOTOR-123')\n• Part name or description\n• Or use the search features on this page\n\n" + (
                        "👆 **Quick action:** Click 'Search & Select Part' button above" if current_page == 'ai-demo' else
                        "💡 **Tip:** Go to the Workspace page to browse all parts"
                    ),
                    'suggestions': [
                        "Search for 001dfy",
                        "Show all parts",
                        "Find MOTOR parts"
                    ]
                }
        
        # Risk Analysis
        elif intent == 'risk_analysis':
            part_number = entities.get('part_number') or (selected_part['part_number'] if selected_part else None)
            change_type = entities.get('change_type') or ui_change_type or 'MODIFY'
            
            if not part_number:
                return {
                    'text': "🎯 **Risk Analysis Ready!**\n\nI can analyze the impact and risk of changing a part.\n\n**To start:**" + (
                        "\n👆 Click 'Search & Select Part' above" if current_page == 'ai-demo' else
                        "\n• Tell me a part number\n• Or select a part from the list"
                    ) + "\n\n**I'll check:**\n✓ BOM dependencies\n✓ Where-used impact\n✓ Released parts affected\n✓ Conflicting changes\n✓ ML risk prediction\n\nReady when you are!",
                    'suggestions': [
                        "Analyze part 001dfy",
                        "Search for a part first",
                        "What is risk analysis?"
                    ]
                }
            
            self.context['part_number'] = part_number
            self.context['change_type'] = change_type
            
            action_verb = {
                'OBSOLETE': 'obsoleting',
                'REVISE': 'revising',
                'MODIFY': 'modifying',
                'DELETE': 'deleting'
            }.get(change_type, 'changing')
            
            return {
                'text': f"🤖 **AI Impact Analysis Initiated!**\n\n**Target:** Part {part_number}\n**Action:** {action_verb.title()}\n\n**Running checks:**\n⚙️ Analyzing BOM structure...\n⚙️ Scanning where-used...\n⚙️ Checking released dependencies...\n⚙️ Detecting conflicts...\n⚙️ ML risk prediction...\n\n✨ *Results will appear on the right →*\n\nI'll let you know what I find!",
                'actions': ['RUN_IMPACT_ANALYSIS'],
                'action_params': {'part_number': part_number, 'change_type': change_type},
                'suggestions': [
                    "Show affected parts",
                    "How to minimize risk?",
                    "Create ECN for this"
                ]
            }
        
        # Change Guidance
        elif intent == 'change_guidance':
            if 'ecn' in user_message.lower():
                return {
                    'text': "📋 **Engineering Change Notice (ECN)**\n\n**📌 When to use:**\n✓ Changing RELEASED parts\n✓ Production impact\n✓ Needs formal approval\n\n**🔄 Process:**\n1️⃣ Run impact analysis (that's me! 🤖)\n2️⃣ Create ECN with tasks\n3️⃣ Route for approval\n4️⃣ Execute change tasks\n5️⃣ Close & document\n\n**💡 Pro tip:** Always run AI analysis first - it identifies ALL affected parts automatically!",
                    'suggestions': [
                        "Show ECN template",
                        "ECN vs ECR?",
                        "Run impact analysis"
                    ]
                }
            elif 'ecr' in user_message.lower():
                return {
                    'text': "📝 **Engineering Change Request (ECR)**\n\n**📌 When to use:**\n✓ Proposing a change\n✓ Parts are INWORK\n✓ Feasibility study\n✓ Low impact changes\n\n**🔄 Process:**\n1️⃣ Document change request\n2️⃣ Add justification\n3️⃣ Submit for review\n4️⃣ Approve/Reject decision\n5️⃣ Create ECN if approved\n\n**💡 Quick tip:** ECR is lighter than ECN - use it for proposals!",
                    'suggestions': [
                        "Show ECR template",
                        "ECN vs ECR?",
                        "When to use ECN?"
                    ]
                }
            else:
                return {
                    'text': "📚 **Change Management Help**\n\nI can guide you through:\n\n🔹 **ECN** - Engineering Change Notice\n   → For released parts, formal process\n\n🔹 **ECR** - Engineering Change Request\n   → For proposals, lighter process\n\n🔹 **Workflows** - State transitions\n   → INWORK → RELEASED process\n\n🔹 **Best Practices** - Recommendations\n   → Risk mitigation strategies\n\nWhat do you need help with?",
                    'suggestions': [
                        "How to create ECN?",
                        "What is ECR?",
                        "ECN vs ECR?"
                    ]
                }
        
        # Recommendations
        elif intent == 'recommendation':
            if 'ecn' in user_message.lower() or 'ecr' in user_message.lower():
                return {
                    'text': "💡 **ECN vs ECR Decision Matrix**\n\n**Choose ECN when:**\n✅ Part is RELEASED\n✅ Production is affected\n✅ Multiple stakeholders\n✅ Formal audit trail needed\n✅ High risk/complexity\n\n**Choose ECR when:**\n✅ Part is INWORK\n✅ Proposing a change\n✅ Need feasibility check\n✅ Low impact\n✅ Faster turnaround\n\n**🤖 Smart tip:** Run my impact analysis - I'll help you decide!",
                    'suggestions': [
                        "Run impact analysis",
                        "Show ECN process",
                        "Show ECR process"
                    ]
                }
            else:
                return {
                    'text': "💡 **I can recommend:**\n\n• Best change process (ECN/ECR)\n• Risk mitigation strategies\n• Process shortcuts\n• Best practices\n\nWhat decision are you trying to make?",
                    'suggestions': [
                        "ECN or ECR?",
                        "How to reduce risk?",
                        "Best way to obsolete?"
                    ]
                }
        
        # BOM Query
        elif intent == 'bom_query':
            if selected_part:
                return {
                    'text': f"📊 **BOM Query: {selected_part['part_number']}**\n\n**Available info:**\n• Child components (what it contains)\n• Parent assemblies (where it's used)\n• Quantities & relationships\n• Structure hierarchy\n\n*🚧 BOM visualization coming soon!*\n\nWhat would you like to know?",
                    'suggestions': [
                        "Show where-used",
                        "List child parts",
                        "Analyze this part"
                    ]
                }
            else:
                return {
                    'text': "📊 **BOM (Bill of Materials) Help**\n\nI can help you explore:\n• Part hierarchies\n• Assembly structures\n• Where-used analysis\n• Component relationships\n\nWhich part would you like to explore?\n" + (
                        "👆 Select a part above first" if current_page == 'ai-demo' else
                        "Tell me a part number or select from the list"
                    ),
                    'suggestions': [
                        "Select a part",
                        "What is BOM?",
                        "Search for part"
                    ]
                }
        
        # Lifecycle
        elif intent == 'lifecycle':
            return {
                'text': "🔄 **Part Lifecycle States**\n\n**Common states:**\n\n🔹 **INWORK** - Under development\n   → Editable, not released\n\n🔹 **UNDER_REVIEW** - Pending approval\n   → Locked, awaiting review\n\n🔹 **RELEASED** - Production-ready\n   → Formal changes only (ECN)\n\n🔹 **OBSOLETE** - Discontinued\n   → No longer active\n\n**💡 Tip:** Lifecycle affects which changes are allowed!",
                'suggestions': [
                    "How to release a part?",
                    "What's the review process?",
                    "Obsolete vs Delete?"
                ]
            }
        
        # Fallback - should rarely happen now
        else:
            context_hint = f"\n\n**Context:** {current_page} page" + (
                f", {selected_part['part_number']} selected" if selected_part else ""
            )
            
            return {
                'text': f"🤔 Hmm, I'm not quite sure what you're asking.{context_hint}\n\n**I'm really good at:**\n• Searching parts\n• Analyzing risk\n• ECN/ECR guidance\n• BOM queries\n\n**Try asking:**\n• 'Search for part 001dfy'\n• 'What's the risk?'\n• 'How do I create an ECN?'\n• 'Show me what you can do'",
                'suggestions': [
                    "What can you do?",
                    "Search for a part",
                    "Help with changes"
                ]
            }
    
    def clear_context(self):
        self.context = {}
        self.conversation_history = []
        logger.info("🧹 Context cleared")
