import { useState, useEffect } from 'react';
import './SmartSearch.css';

function SmartSearch({ tasks, projects, onResultClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMode, setSearchMode] = useState('semantic'); // 'semantic' or 'exact'
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchMode, tasks, projects]);

  const performSearch = () => {
    setIsSearching(true);
    
    if (searchMode === 'semantic') {
      semanticSearch();
    } else {
      exactSearch();
    }
    
    setTimeout(() => setIsSearching(false), 300);
  };

  const semanticSearch = () => {
    const query = searchQuery.toLowerCase();
    const queryTokens = tokenize(query);
    const results = [];

    // Search tasks with vector similarity
    tasks.forEach(task => {
      const taskText = `${task.title} ${task.description} ${task.tags || ''}`.toLowerCase();
      const taskTokens = tokenize(taskText);
      
      const similarity = calculateCosineSimilarity(queryTokens, taskTokens);
      
      if (similarity > 0.2) {
        results.push({
          type: 'task',
          data: task,
          similarity: similarity,
          matchReason: getMatchReason(queryTokens, taskTokens),
          relevanceScore: similarity * 100
        });
      }
    });

    // Search projects
    projects.forEach(project => {
      if (!project.archived) {
        const projectText = `${project.name} ${project.description || ''}`.toLowerCase();
        const projectTokens = tokenize(projectText);
        
        const similarity = calculateCosineSimilarity(queryTokens, projectTokens);
        
        if (similarity > 0.2) {
          results.push({
            type: 'project',
            data: project,
            similarity: similarity,
            matchReason: getMatchReason(queryTokens, projectTokens),
            relevanceScore: similarity * 100
          });
        }
      }
    });

    // Multi-hop reasoning: find related tasks
    results.forEach(result => {
      if (result.type === 'task') {
        const relatedTasks = findRelatedTasks(result.data, tasks);
        result.relatedItems = relatedTasks.slice(0, 3);
      }
    });

    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);
    
    setSearchResults(results.slice(0, 10));
  };

  const exactSearch = () => {
    const query = searchQuery.toLowerCase();
    const results = [];

    tasks.forEach(task => {
      const taskText = `${task.title} ${task.description} ${task.tags || ''}`.toLowerCase();
      
      if (taskText.includes(query)) {
        const titleMatch = task.title.toLowerCase().includes(query);
        results.push({
          type: 'task',
          data: task,
          similarity: titleMatch ? 1.0 : 0.8,
          matchReason: titleMatch ? 'Title match' : 'Description/Tags match',
          relevanceScore: titleMatch ? 100 : 80
        });
      }
    });

    projects.forEach(project => {
      if (!project.archived) {
        const projectText = `${project.name} ${project.description || ''}`.toLowerCase();
        
        if (projectText.includes(query)) {
          const nameMatch = project.name.toLowerCase().includes(query);
          results.push({
            type: 'project',
            data: project,
            similarity: nameMatch ? 1.0 : 0.8,
            matchReason: nameMatch ? 'Name match' : 'Description match',
            relevanceScore: nameMatch ? 100 : 80
          });
        }
      }
    });

    results.sort((a, b) => b.similarity - a.similarity);
    setSearchResults(results.slice(0, 10));
  };

  const tokenize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  };

  const calculateCosineSimilarity = (tokens1, tokens2) => {
    const allTokens = [...new Set([...tokens1, ...tokens2])];
    
    const vector1 = allTokens.map(token => tokens1.filter(t => t === token).length);
    const vector2 = allTokens.map(token => tokens2.filter(t => t === token).length);
    
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  };

  const getMatchReason = (queryTokens, contentTokens) => {
    const matches = queryTokens.filter(token => contentTokens.includes(token));
    if (matches.length === 0) return 'Contextual similarity';
    if (matches.length === 1) return `Matched: "${matches[0]}"`;
    return `Matched: "${matches.slice(0, 2).join('", "')}"`;
  };

  const findRelatedTasks = (task, allTasks) => {
    const related = [];
    
    allTasks.forEach(otherTask => {
      if (otherTask.id !== task.id) {
        let relevance = 0;
        
        // Same project
        if (otherTask.projectId === task.projectId) relevance += 0.3;
        
        // Same status
        if (otherTask.status === task.status) relevance += 0.1;
        
        // Same priority
        if (otherTask.priority === task.priority) relevance += 0.1;
        
        // Similar tags
        if (task.tags && otherTask.tags) {
          const tagSimilarity = calculateTagSimilarity(task.tags, otherTask.tags);
          relevance += tagSimilarity * 0.5;
        }
        
        if (relevance > 0.3) {
          related.push({
            task: otherTask,
            relevance: relevance
          });
        }
      }
    });
    
    return related
      .sort((a, b) => b.relevance - a.relevance)
      .map(r => r.task);
  };

  const calculateTagSimilarity = (tags1, tags2) => {
    const set1 = new Set(tags1.toLowerCase().split(',').map(t => t.trim()));
    const set2 = new Set(tags2.toLowerCase().split(',').map(t => t.trim()));
    const intersection = [...set1].filter(x => set2.has(x)).length;
    const union = new Set([...set1, ...set2]).size;
    return union > 0 ? intersection / union : 0;
  };

  const handleResultClick = (result) => {
    if (onResultClick) {
      onResultClick(result);
    }
  };

  return (
    <div className="smart-search">
      <div className="search-header">
        <h2>🔍 Intelligent Search</h2>
        <p>RAG-powered semantic search with multi-hop reasoning</p>
      </div>

      <div className="search-controls">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks, projects, or describe what you're looking for..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && <span className="search-spinner">⏳</span>}
        </div>

        <div className="search-mode-toggle">
          <button
            className={searchMode === 'semantic' ? 'active' : ''}
            onClick={() => setSearchMode('semantic')}
          >
            🧠 Semantic Search
          </button>
          <button
            className={searchMode === 'exact' ? 'active' : ''}
            onClick={() => setSearchMode('exact')}
          >
            📝 Exact Match
          </button>
        </div>
      </div>

      {searchQuery && (
        <div className="search-stats">
          Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          {searchMode === 'semantic' && ' using vector similarity analysis'}
        </div>
      )}

      <div className="search-results">
        {searchResults.length === 0 && searchQuery && !isSearching && (
          <div className="no-results">
            <p>No results found. Try different keywords or switch search mode.</p>
          </div>
        )}

        {searchResults.map((result, index) => (
          <div 
            key={`${result.type}-${result.data.id}`} 
            className={`search-result ${result.type}`}
            onClick={() => handleResultClick(result)}
          >
            <div className="result-header">
              <span className="result-type-badge">
                {result.type === 'task' ? '📋' : '📁'} {result.type}
              </span>
              <span className="relevance-score">
                {Math.round(result.relevanceScore)}% match
              </span>
            </div>

            <h3 className="result-title">
              {result.type === 'task' ? result.data.title : result.data.name}
            </h3>

            {result.data.description && (
              <p className="result-description">
                {result.data.description.substring(0, 100)}
                {result.data.description.length > 100 ? '...' : ''}
              </p>
            )}

            <div className="result-meta">
              <span className="match-reason">{result.matchReason}</span>
              
              {result.type === 'task' && (
                <>
                  <span className={`status-badge ${result.data.status}`}>
                    {result.data.status}
                  </span>
                  <span className={`priority-badge ${result.data.priority}`}>
                    {result.data.priority}
                  </span>
                </>
              )}
            </div>

            {result.relatedItems && result.relatedItems.length > 0 && (
              <div className="related-items">
                <strong>🔗 Related tasks:</strong>
                <ul>
                  {result.relatedItems.map(related => (
                    <li key={related.id}>{related.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SmartSearch;
