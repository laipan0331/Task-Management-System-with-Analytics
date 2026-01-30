import { useState, useEffect, useRef } from 'react';
import './KnowledgeGraph.css';

function KnowledgeGraph({ tasks, projects, onTaskClick }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    buildGraph();
  }, [tasks, projects]);

  useEffect(() => {
    if (canvasRef.current && nodes.length > 0) {
      drawGraph();
    }
  }, [nodes, edges, hoveredNode, selectedNode]);

  const buildGraph = () => {
    const graphNodes = [];
    const graphEdges = [];
    const nodeMap = new Map();

    // Add project nodes
    projects.forEach(project => {
      if (!project.archived) {
        const node = {
          id: `project-${project.id}`,
          type: 'project',
          label: project.name,
          x: Math.random() * 600 + 100,
          y: Math.random() * 400 + 100,
          data: project
        };
        graphNodes.push(node);
        nodeMap.set(node.id, node);
      }
    });

    // Add task nodes and edges
    tasks.forEach(task => {
      const taskNode = {
        id: `task-${task.id}`,
        type: 'task',
        label: task.title,
        x: Math.random() * 600 + 100,
        y: Math.random() * 400 + 100,
        status: task.status,
        priority: task.priority,
        data: task
      };
      graphNodes.push(taskNode);
      nodeMap.set(taskNode.id, taskNode);

      // Link task to project
      if (task.projectId) {
        const projectNodeId = `project-${task.projectId}`;
        if (nodeMap.has(projectNodeId)) {
          graphEdges.push({
            from: taskNode.id,
            to: projectNodeId,
            type: 'belongs-to',
            weight: 1
          });
        }
      }

      // Link parent-child tasks
      if (task.parentTaskId) {
        const parentNodeId = `task-${task.parentTaskId}`;
        graphEdges.push({
          from: taskNode.id,
          to: parentNodeId,
          type: 'subtask-of',
          weight: 0.8
        });
      }

      // Link tasks with similar tags
      tasks.forEach(otherTask => {
        if (task.id !== otherTask.id && task.tags && otherTask.tags) {
          const similarity = calculateTagSimilarity(task.tags, otherTask.tags);
          if (similarity > 0.3) {
            const otherNodeId = `task-${otherTask.id}`;
            if (!graphEdges.find(e => 
              (e.from === taskNode.id && e.to === otherNodeId) ||
              (e.from === otherNodeId && e.to === taskNode.id)
            )) {
              graphEdges.push({
                from: taskNode.id,
                to: otherNodeId,
                type: 'similar-to',
                weight: similarity
              });
            }
          }
        }
      });
    });

    // Apply force-directed layout
    applyForceLayout(graphNodes, graphEdges);
    
    setNodes(graphNodes);
    setEdges(graphEdges);
  };

  const calculateTagSimilarity = (tags1, tags2) => {
    if (!tags1 || !tags2) return 0;
    const set1 = new Set(tags1.toLowerCase().split(',').map(t => t.trim()));
    const set2 = new Set(tags2.toLowerCase().split(',').map(t => t.trim()));
    const intersection = [...set1].filter(x => set2.has(x)).length;
    const union = new Set([...set1, ...set2]).size;
    return union > 0 ? intersection / union : 0;
  };

  const applyForceLayout = (nodes, edges, iterations = 50) => {
    const centerX = 400;
    const centerY = 300;
    const repulsion = 50000;
    const attraction = 0.01;
    const damping = 0.9;

    for (let iter = 0; iter < iterations; iter++) {
      // Apply repulsive forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        let fx = 0, fy = 0;
        
        for (let j = 0; j < nodes.length; j++) {
          if (i !== j) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = repulsion / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        }

        // Apply attractive forces along edges
        edges.forEach(edge => {
          const fromNode = edge.from === nodes[i].id ? nodes[i] : 
                          edge.to === nodes[i].id ? nodes[i] : null;
          if (fromNode) {
            const toNode = nodes.find(n => 
              n.id === (edge.from === fromNode.id ? edge.to : edge.from)
            );
            if (toNode) {
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              fx += dx * attraction * edge.weight;
              fy += dy * attraction * edge.weight;
            }
          }
        });

        // Center gravity
        fx += (centerX - nodes[i].x) * 0.001;
        fy += (centerY - nodes[i].y) * 0.001;

        nodes[i].vx = (nodes[i].vx || 0) * damping + fx * 0.01;
        nodes[i].vy = (nodes[i].vy || 0) * damping + fy * 0.01;
        nodes[i].x += nodes[i].vx;
        nodes[i].y += nodes[i].vy;

        // Keep within bounds
        nodes[i].x = Math.max(50, Math.min(750, nodes[i].x));
        nodes[i].y = Math.max(50, Math.min(550, nodes[i].y));
      }
    }
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        
        if (edge.type === 'similar-to') {
          ctx.strokeStyle = `rgba(100, 150, 255, ${edge.weight})`;
          ctx.setLineDash([5, 5]);
        } else if (edge.type === 'subtask-of') {
          ctx.strokeStyle = 'rgba(255, 180, 50, 0.6)';
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(150, 150, 150, 0.4)';
          ctx.setLineDash([]);
        }
        
        ctx.lineWidth = edge.weight * 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      
      ctx.beginPath();
      const radius = node.type === 'project' ? 25 : 18;
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      
      if (node.type === 'project') {
        ctx.fillStyle = isSelected ? '#3a7bd5' : isHovered ? '#4a8be5' : '#5a9bf5';
      } else {
        if (node.status === 'completed') {
          ctx.fillStyle = isSelected ? '#2d8653' : isHovered ? '#3d9663' : '#4da673';
        } else if (node.status === 'in-progress') {
          ctx.fillStyle = isSelected ? '#d68910' : isHovered ? '#e69920' : '#f6a930';
        } else {
          ctx.fillStyle = isSelected ? '#9095a0' : isHovered ? '#a0a5b0' : '#b0b5c0';
        }
      }
      
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw label
      ctx.fillStyle = '#333';
      ctx.font = node.type === 'project' ? 'bold 12px Arial' : '11px Arial';
      ctx.textAlign = 'center';
      const labelY = node.y + radius + 15;
      const maxWidth = 80;
      const label = node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label;
      ctx.fillText(label, node.x, labelY, maxWidth);
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const radius = node.type === 'project' ? 25 : 18;
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return dist <= radius;
    });

    setSelectedNode(clickedNode || null);
    
    if (clickedNode && clickedNode.type === 'task' && onTaskClick) {
      onTaskClick(clickedNode.data);
    }
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hoveredNode = nodes.find(node => {
      const radius = node.type === 'project' ? 25 : 18;
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return dist <= radius;
    });

    setHoveredNode(hoveredNode || null);
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  };

  const getConnectedNodes = (nodeId) => {
    const connected = new Set();
    edges.forEach(edge => {
      if (edge.from === nodeId) connected.add(edge.to);
      if (edge.to === nodeId) connected.add(edge.from);
    });
    return Array.from(connected);
  };

  return (
    <div className="knowledge-graph">
      <div className="graph-header">
        <h2>🧠 Knowledge Graph Visualization</h2>
        <p>Multi-hop relationship analysis across projects and tasks</p>
      </div>
      
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-circle project"></span>
          <span>Projects</span>
        </div>
        <div className="legend-item">
          <span className="legend-circle task-completed"></span>
          <span>Completed Tasks</span>
        </div>
        <div className="legend-item">
          <span className="legend-circle task-progress"></span>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <span className="legend-circle task-pending"></span>
          <span>Pending Tasks</span>
        </div>
        <div className="legend-item">
          <span className="legend-line solid"></span>
          <span>Direct Link</span>
        </div>
        <div className="legend-item">
          <span className="legend-line dashed"></span>
          <span>Similar Content</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="graph-canvas"
      />

      {selectedNode && (
        <div className="node-details">
          <h3>{selectedNode.label}</h3>
          <p className="node-type">Type: {selectedNode.type}</p>
          {selectedNode.type === 'task' && (
            <>
              <p>Status: <span className={`status-${selectedNode.status}`}>{selectedNode.status}</span></p>
              <p>Priority: <span className={`priority-${selectedNode.priority}`}>{selectedNode.priority}</span></p>
            </>
          )}
          <p className="connections">
            Connected nodes: {getConnectedNodes(selectedNode.id).length}
          </p>
        </div>
      )}
    </div>
  );
}

export default KnowledgeGraph;
