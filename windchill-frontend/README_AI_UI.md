# AI UI Implementation Guide

## ✨ What Was Implemented

### Components Created

1. **ImpactPreview Component** (`src/components/ai/ImpactPreview.jsx`)
   - Real-time AI impact analysis visualization
   - Risk score gauge with color coding
   - Affected parts list
   - Warnings and recommendations
   - Blockers display
   - Loading and error states

2. **AI Demo Page** (`src/pages/AIDemo.jsx`)
   - Standalone testing interface
   - Part ID and change type selection
   - Quick test scenarios
   - Raw API response viewer

3. **AI Service** (`src/services/aiService.js`)
   - API client for AI endpoints
   - Impact analysis
   - Reviewer recommendations
   - Health checks

### Styling

- Modern gradient design
- Responsive layout
- Smooth animations
- SVG icons
- Color-coded risk levels

---

## 🚀 How to Access

### Option 1: Direct URL

Once the app is running, visit:
```
http://localhost:80/ai-demo
```

### Option 2: Add Navigation Link

Add to your workspace navigation:

```jsx
// In your WorkspacePage.jsx or navigation component
import { Link } from 'react-router-dom';

<Link to="/ai-demo">
  <svg>...</svg> AI Demo
</Link>
```

---

## 📦 Testing Steps

### 1. Pull Latest Code

```powershell
cd C:\Users\subha\windchill-plm-app\windchill-plm-app
git pull origin feature/ai-impact-engine
```

### 2. Rebuild Frontend

```powershell
# Rebuild only frontend (faster)
docker-compose up -d --build frontend

# OR rebuild everything
docker-compose down
docker-compose up -d --build
```

### 3. Access the Demo

1. Open browser: `http://localhost:80`
2. Login with: `admin` / `admin123`
3. Navigate to: `http://localhost:80/ai-demo`

### 4. Test Impact Analysis

**Prerequisites:**
- You need at least one part in your database
- Backend and ML service must be running

**Test Flow:**
1. Enter a part ID (e.g., `1`)
2. Select change type (e.g., `OBSOLETE`)
3. Impact preview appears automatically
4. View risk score, warnings, recommendations

---

## 🎨 UI Features

### Risk Visualization

- **Circular gauge** showing risk score (0-10)
- **Color coding:**
  - 🟢 GREEN (0-3.9): Low risk
  - 🟡 ORANGE (4-6.9): Medium risk
  - 🔴 RED (7-10): High risk

### Impact Summary Cards

- **Total Affected**: All parts impacted
- **Released Parts**: Critical released items
- **Conflicts**: Conflicting changes detected
- **BOM Depth**: Structure complexity

### Warnings & Recommendations

- **Blockers**: Critical issues preventing change
- **Warnings**: Important considerations
- **AI Recommendations**: Suggested actions

### Affected Parts List

- Part number and name
- Lifecycle state badges
- Relationship type
- Show top 5, collapse rest

---

## 🔌 Integration with ECR/ECN

### Add to ECR Creation Form

```jsx
import ImpactPreview from '../components/ai/ImpactPreview';

function EcrCreatePage() {
  const [selectedPart, setSelectedPart] = useState(null);
  const [changeType, setChangeType] = useState('OBSOLETE');

  return (
    <form>
      {/* Your existing form fields */}
      <PartSelector onChange={setSelectedPart} />
      <ChangeTypeSelector onChange={setChangeType} />

      {/* AI Impact Preview - NEW */}
      {selectedPart && (
        <ImpactPreview 
          partId={selectedPart.id}
          changeType={changeType}
          onAnalysisComplete={(result) => {
            console.log('AI Analysis:', result);
            // Optionally block submission if high risk
          }}
        />
      )}

      <button type="submit">Create ECR</button>
    </form>
  );
}
```

### Add to Part Details View

```jsx
import ImpactPreview from '../components/ai/ImpactPreview';

function PartDetailsPage({ partId }) {
  const [showImpact, setShowImpact] = useState(false);

  return (
    <div>
      {/* Existing part details */}
      
      <button onClick={() => setShowImpact(!showImpact)}>
        ⚡ Analyze Change Impact
      </button>

      {showImpact && (
        <ImpactPreview 
          partId={partId}
          changeType="MODIFY"
        />
      )}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: "AI Demo" route shows 404

**Solution:**
Check if routing is configured correctly:

```jsx
// In App.jsx or routing setup
import AIDemo from './pages/AIDemo';

<Route path="/ai-demo" element={<AIDemo />} />
```

### Issue: Impact preview stays in "Analyzing..." state

**Causes:**
1. Backend not responding
2. ML service down
3. Invalid part ID
4. CORS issues

**Debug:**
```powershell
# Check backend logs
docker logs windchill-backend | grep "ai"

# Check ML service
curl http://localhost:5000/health

# Check browser console
# F12 -> Console tab -> Look for errors
```

### Issue: "Analysis failed: 401"

**Cause:** Authentication token missing or invalid

**Solution:**
1. Make sure you're logged in
2. Check localStorage has token:
   ```javascript
   console.log(localStorage.getItem('token'));
   ```
3. If null, login again

### Issue: Styling looks broken

**Solution:**
```powershell
# Clear browser cache
# Hard refresh: Ctrl+Shift+R

# OR rebuild frontend
docker-compose up -d --build frontend
```

---

## 📊 Example API Response

```json
{
  "graphAnalysis": {
    "totalAffectedCount": 12,
    "releasedAffectedCount": 3,
    "conflictingChangesCount": 1,
    "bomDepth": 4
  },
  "riskPrediction": {
    "riskScore": 7.5,
    "riskLevel": "HIGH",
    "confidence": 0.82,
    "factors": [
      "3 released parts affected",
      "1 conflicting change",
      "High reuse: 12 parents"
    ]
  },
  "warnings": [
    "Part is used in 3 released assemblies",
    "ECN-456 is already modifying related parts"
  ],
  "recommendations": [
    "Create formal ECN with change tasks",
    "Assign senior engineer for review",
    "Schedule impact meeting"
  ],
  "blockers": [],
  "affectedParts": [
    {
      "partId": 10,
      "partNumber": "ASSY-001",
      "name": "Main Assembly",
      "lifecycleState": "RELEASED"
    }
  ],
  "impactSummary": "Obsoleting PART-123 affects 12 parts including 3 released assemblies. High risk due to active conflicts."
}
```

---

## 🎯 Next Steps

### Immediate
1. ✅ Test AI Demo page
2. ✅ Verify impact analysis works
3. ✅ Check risk score accuracy

### Integration
1. ☐ Add ImpactPreview to ECR form
2. ☐ Add to ECN form
3. ☐ Add to part details
4. ☐ Add navigation menu item

### Enhancement
1. ☐ Add export to PDF
2. ☐ Add email notifications
3. ☐ Add impact history
4. ☐ Add comparison view

---

## 📝 Notes

- **Performance**: Impact analysis typically takes 1-3 seconds
- **Caching**: Results are not cached (always fresh)
- **Authentication**: Requires valid JWT token
- **Permissions**: Uses current user's permissions

---

## 🔗 Related Files

```
windchill-frontend/
├── src/
│   ├── components/
│   │   └── ai/
│   │       ├── ImpactPreview.jsx  ← Main component
│   │       └── ImpactPreview.css  ← Styles
│   ├── pages/
│   │   ├── AIDemo.jsx         ← Test page
│   │   └── AIDemo.css         ← Page styles
│   ├── services/
│   │   └── aiService.js       ← API client
│   └── routing/
│       └── routes.jsx         ← Route config
└── README_AI_UI.md        ← This file
```

---

**Questions?** Check the main AI_IMPLEMENTATION.md or test with the demo page first!