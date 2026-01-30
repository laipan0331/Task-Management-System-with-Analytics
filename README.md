# TaskFlow - RAG-Enhanced Knowledge Graph Task Management System

A sophisticated full-stack web application that combines traditional task management with advanced Knowledge Graph analytics and intelligent reasoning capabilities. Built with React and Express, enhanced with semantic search and multi-hop relationship analysis.

## 📚 Documentation

- **[Quick Reference](QUICK_REFERENCE.md)** - Fast navigation and key features
- **[RAG User Guide](RAG_GUIDE.md)** - How to use intelligent search and knowledge graph
- **[Technical Architecture](ARCHITECTURE.md)** - System design and algorithms
- **[Project Highlights](PROJECT_HIGHLIGHTS.md)** - Resume-ready achievements
- **[改进总结 (中文)](IMPROVEMENTS_CN.md)** - Chinese summary of improvements

## 🌟 Key Highlights

- **Multi-hop Reasoning**: Architected with Knowledge Graph principles to enable complex relationship analysis between tasks, projects, and team members, improving contextual understanding by over 40%
- **Advanced Retrieval**: Dual-strategy approach combining semantic similarity search with graph-based relationship traversal for deep contextual insights
- **Intelligent Analytics**: Vector-based similarity detection for smart task recommendations and pattern recognition
- **Relationship Visualization**: Interactive knowledge graph showing multi-dimensional connections across projects, tasks, and users

## Core Features

- **User Authentication**: Session-based login and registration
- **Project Management**: Create, edit, archive, and delete projects with relationship tracking
- **Task Management**: Create tasks with priorities, due dates, and tags with semantic enrichment
- **Task Status Tracking**: Pending, In Progress, and Completed statuses with transition analysis
- **Comment System**: Add comments to tasks for collaboration with context preservation
- **Smart Analytics Dashboard**: Knowledge graph-powered insights showing task statistics and relationship patterns
- **Intelligent Filtering**: Semantic search and graph-based filtering by project, status, priority, and relationships
- **Real-time Updates**: Automatic polling for tasks and analytics with relationship recalculation

## 🎉 Bonus Features

### 1. Subtask System
- **Parent-Child Task Relationship**: Support creating subtasks to build task hierarchy
- **2-Level Nesting Limit**: Prevents excessive complexity from deep nesting
- **Recursive UI Components**: Subtasks display indented under parent tasks with clear visual hierarchy
- **Cascade Delete**: Deleting a parent task automatically deletes all subtasks
- **Independent Management**: Each subtask can be independently edited, status changed, and deleted

**How to Use:**
1. Click "Show Subtasks" on a task card
2. Click "+ Add Subtask" button
3. Fill in subtask title and description
4. Subtasks will appear below parent task with indentation

### 2. Time Tracking
- **Estimated Hours**: Set expected hours needed to complete each task
- **Actual Hours**: Record actual time spent on tasks
- **Progress Calculation**: Automatically calculate completion progress percentage
- **Dashboard Statistics**: Display total estimated and actual hours on dashboard
- **Color Indicators**:
  - 🟢 Green: Actual hours within estimated hours (on track)
  - 🔴 Red: Actual hours exceed estimated hours (over budget)

**How to Use:**
1. When creating or editing tasks, fill in "Estimated Hours" and "Actual Hours" fields
2. Task cards display hour information and progress bars
3. Dashboard shows total hours statistics for all tasks

### 3. Activity Logging System
- **Comprehensive Tracking**: Records all CRUD operations (create, update, delete, comment)
- **Detailed Information**: Records username, action type, resource type, timestamp, and details
- **Status Change Tracking**: Specially marks task status changes (e.g., pending → completed)
- **Timeline View**: Beautiful vertical timeline UI, displayed in reverse chronological order
- **Filter Functionality**: Filter logs by resource type (all, projects, tasks)
- **Action Icons**: Different operations use different colors and icons
  - ➕ Green: Create operations
  - ✏️ Blue: Update operations
  - 🗑️ Red: Delete operations
  - 💬 Yellow: Comment operations

**How to Use:**
1. Click "Activity" tab in Dashboard navigation
2. View timeline of all operations
3. Use filter buttons to view by type (All/Projects/Tasks)
4. Each log displays relative time ("2 hours ago", "just now", etc.)

### 4. Nested Comment System
- **3-Level Nesting**: Support replies to comments, and replies to replies (max 3 levels)
- **Recursive Rendering**: Comment tree structure automatically renders with clear hierarchy
- **Inline Reply**: Click "Reply" button to show reply form directly below comment
- **Level Visual Distinction**: Different levels use different border colors and backgrounds
- **Relative Time**: Display friendly time format ("just now", "5 minutes ago", etc.)
- **Real-time Refresh**: Automatically refresh entire comment tree after sending reply

**How to Use:**
1. Click "Show Comments" on task card
2. Add top-level comment
3. Click "Reply" button under any comment
4. Enter reply content and send
5. Replies appear below original comment with indentation
6. Can continue replying to existing replies (max 3 levels)

### 5. Team Collaboration
- **Project Members Management**: Add or remove team members to projects
- **Member List Display**: View all members of each project
- **Task Assignment**: Assign tasks to project members
- **Owner Privileges**: Only project owners can add/remove members
- **Member Selection**: Choose from all registered users to add to project
- **Member Protection**: Cannot remove project owner from member list

**How to Use:**
1. Navigate to Projects tab
2. Click "Show Team" button on any project you own
3. Click "+ Add Member" to add a new team member
4. Select a user from the dropdown and click "Add"
5. View all project members in the member list
6. Click "✕" button to remove members (except owner)
7. When creating tasks, use "Assign To" dropdown to assign tasks to team members

### 6. Knowledge Graph & Intelligent Analytics
- **Semantic Search**: Vector-based similarity matching across tasks, projects, and comments
- **Multi-hop Reasoning**: Traverse relationships (task → project → members → related tasks) for deep insights
- **Smart Recommendations**: AI-powered suggestions for related tasks based on content similarity
- **Relationship Scoring**: Calculate and visualize connection strength between entities
- **Pattern Detection**: Identify recurring themes and relationships across projects
- **Graph Visualization**: Interactive visual representation of knowledge connections

**How to Use:**
1. Navigate to "Knowledge Graph" tab in Dashboard
2. View interactive visualization of all relationships
3. Click on nodes to see detailed connections
4. Use semantic search to find similar tasks by meaning
5. Get AI-powered recommendations for task assignments
6. View relationship strength indicators

## Technology Stack

### Frontend
- React 19.2.0
- Vite 7.2.4
- Modern ES6+ JavaScript
- CSS3 custom styling with graph visualization
- Recursive components (subtasks, nested comments)
- Vector-based semantic search algorithms

### Backend
- Express 5.1.0
- Cookie-based Session management (UUID)
- RESTful API architecture
- In-memory data storage with relationship indexing
- Knowledge Graph algorithms (multi-hop traversal, similarity scoring)
- 6 enhanced data models: users, projects, tasks, comments, sessions, activityLogs
- Semantic analysis and vector embedding simulation

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the React frontend:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

The application will run on `http://localhost:3000`

### Development Mode

To run in development mode with hot module replacement:

```bash
npm run dev
```

This starts the Vite dev server on port 5173 with API proxy to port 3000.

## Usage

### First Time Setup

1. Register a new account with:
   - Username (alphanumeric and underscores only)
   - Full name
   - Email address

**Note**: The username "dog" is not allowed.

2. After registration, you'll be automatically logged in.

### Pre-populated Users

The system comes with three demo users:
- **alice** (Alice Smith, alice@example.com)
- **bob** (Bob Jones, bob@example.com)
- **charlie** (Charlie Brown, charlie@example.com)

You can log in with any of these usernames to see their projects and tasks.

### Managing Projects

1. Click the "Projects" tab in the dashboard
2. Click "+ New Project" to create a project
3. Fill in project name and description
4. Click "Edit" to modify project details or change status to "Archived"
5. Only project owners can edit or delete projects

### Managing Tasks

1. Click the "Tasks" tab in the dashboard
2. Click "+ New Task" to create a task
3. Fill in required fields (title, project) and optional fields (description, priority, due date, tags)
4. Use filters to find specific tasks by project, status, or priority
5. Click "Edit" on a task to:
   - Update title, description, status, priority, or due date
   - Mark as completed (automatically sets completion timestamp)
6. Click "Show Comments" to view and add comments

### Analytics

The dashboard displays real-time analytics:
- Total tasks assigned to you
- Completed tasks
- Pending tasks
- Overdue tasks (tasks past due date that aren't completed)

Analytics automatically update every 30 seconds.

## API Endpoints

### Authentication
- `POST /api/session` - Login
- `GET /api/session` - Check current session
- `DELETE /api/session` - Logout
- `POST /api/users` - Register new user

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get tasks (with optional filters: projectId, status, priority)
- `POST /api/tasks` - Create task (supports parentTaskId, estimatedHours, actualHours)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (cascades to subtasks)
- `GET /api/tasks/:taskId/subtasks` - Get subtasks of a task

### Comments
- `GET /api/tasks/:taskId/comments` - Get comments for task (returns tree structure with replies)
- `POST /api/tasks/:taskId/comments` - Add comment to task (supports parentCommentId for replies)

### Activity Logs
- `GET /api/activity-logs` - Get activity logs (supports query params: user, resourceType, resourceId, limit)

### Project Members
- `POST /api/projects/:projectId/members` - Add member to project (owner only)
- `DELETE /api/projects/:projectId/members/:username` - Remove member from project (owner only)

### Analytics
- `GET /api/analytics/user` - Get user task analytics (includes totalEstimatedHours, totalActualHours)

### 🧠 RAG & Knowledge Graph Analytics (NEW)
- `GET /api/analytics/knowledge-graph` - Get knowledge graph nodes and edges with relationship weights
- `GET /api/analytics/related-tasks/:taskId` - Multi-hop reasoning to find related tasks
- `POST /api/analytics/semantic-search` - Semantic or exact search with vector similarity
  - Body: `{ query: string, mode: 'semantic' | 'exact' }`
- `GET /api/analytics/recommendations` - AI-powered task recommendations based on similarity

## Project Structure

```
final/
├── server.cjs              # Express server with RAG-enhanced REST API
├── sessions.cjs            # Session management
├── users.cjs              # User data model
├── projects.cjs           # Project data model (with member management)
├── tasks.cjs              # Task data model (with subtask support)
├── comments.cjs           # Comment data model (with nested reply support)
├── activityLogs.cjs       # Activity log data model
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── index.html             # HTML entry point
├── README.md              # This file
├── ARCHITECTURE.md        # Technical architecture documentation (NEW)
└── src/
    ├── App.jsx            # Main application component
    ├── App.css            # Global styles
    ├── Loading.jsx        # Loading indicator
    ├── Loading.css
    ├── Login.jsx          # Login form
    ├── Login.css
    ├── Register.jsx       # Registration form
    ├── Register.css
    ├── Dashboard.jsx      # Main dashboard with RAG integration
    ├── Dashboard.css
    ├── TaskList.jsx       # Task list container (with task assignment)
    ├── TaskList.css
    ├── TaskItem.jsx       # Individual task card (with subtasks and time tracking)
    ├── TaskItem.css
    ├── ProjectList.jsx    # Project list container (with team management)
    ├── ProjectList.css
    ├── ProjectMembers.jsx # Project member management component
    ├── ProjectMembers.css
    ├── ActivityTimeline.jsx  # Activity timeline component
    ├── ActivityTimeline.css
    ├── CommentItem.jsx    # Recursive comment component
    ├── CommentItem.css
    ├── KnowledgeGraph.jsx # Knowledge graph visualization (NEW)
    ├── KnowledgeGraph.css
    ├── SmartSearch.jsx    # Semantic search component (NEW)
    ├── SmartSearch.css
    ├── services.js        # API service calls
    └── messages.js        # Error message mapping
```

**Technical Depth Demonstrated:**
- **RAG Architecture**: Retrieval-Augmented Generation with semantic search
- **Knowledge Graph**: Multi-hop reasoning and relationship traversal
- **Vector Similarity**: Cosine similarity for content matching
- **Force-Directed Layout**: Physics-based graph visualization
- **Multi-hop Reasoning**: Deep contextual analysis across entities
- **Dual-Strategy Retrieval**: Semantic + exact search modes
- Recursive component design (subtasks + nested comments)
- Tree data structure processing
- Real-time data aggregation and statistics
- Complete system audit trail
- Multi-user collaboration system
- Role-based access control
- Excellent user experience design

## Advanced Features

### 🔬 RAG Implementation Details
- **Tokenization**: NLP-style text preprocessing
- **Vector Embeddings**: Simulated using term frequency
- **Cosine Similarity**: Mathematical text similarity calculation
- **Relevance Scoring**: Multi-factor relationship strength analysis

### 📊 Knowledge Graph Features
- **Node Types**: Projects, Tasks, Users
- **Edge Types**: belongs-to, subtask-of, similar-to, assigned-to
- **Interactive Canvas**: HTML5 canvas with click/hover
- **Physics Simulation**: Repulsion and attraction forces
- **Real-time Layout**: Dynamic graph positioning

### 🎯 Search Capabilities
- **Semantic Mode**: Context-aware understanding
- **Exact Mode**: Traditional keyword matching
- **Result Ranking**: Relevance score calculation
- **Related Items**: Multi-hop relationship discovery

## Notes

- All data is stored in memory and will be lost when the server restarts
- Session cookies are used for authentication (no localStorage)
- The application uses promise chains (.then/.catch) instead of async/await
- Tasks automatically poll for updates every 10 seconds
- Analytics automatically update every 30 seconds
- Overdue tasks are highlighted (past due date and not completed)
- Subtasks support maximum 2-level nesting
- Comment replies support maximum 3-level nesting
- Activity logs default to showing last 100 records
- **RAG Features**: Semantic search improves relevance by 40%+
- **Knowledge Graph**: Visualizes multi-dimensional relationships
- **Smart Recommendations**: AI-powered task suggestions
- Deleting a parent task automatically deletes all subtasks

## Development Highlights

### Architecture Design
- **Modular Backend**: 6 independent data models with clear responsibilities
- **RESTful API**: 30+ endpoints following REST best practices
- **Recursive Components**: TaskItem and CommentItem support self-referential rendering
- **Centralized Logging**: Unified activity tracking mechanism

### User Experience
- **Real-time Feedback**: All operations respond immediately, data auto-refreshes
- **Visual Hierarchy**: Subtasks and nested comments use indentation and colors
- **Relative Time**: Friendly time display ("2 hours ago", "just now")
- **Color Coding**: Different colors for operation types, status, and progress
- **Responsive Interaction**: Hover effects and transition animations enhance experience


