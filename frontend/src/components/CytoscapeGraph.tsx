import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { GraphNode, GraphEdge } from '../types';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface CytoscapeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
  height?: string;
}

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  nodes,
  edges,
  onSelectNode,
  selectedNodeId,
  height = '500px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Convert nodes to Cytoscape elements
    const elements: cytoscape.ElementDefinition[] = [
      ...nodes.map((n) => ({
        data: {
          id: n.id,
          label: `${n.bank_name}\n${n.masked_account}`,
          bank_name: n.bank_name,
          masked_account: n.masked_account,
          holder_name: n.holder_name,
          risk_score: n.risk_score,
          risk_category: n.risk_category,
          node_type: n.node_type,
          device_id: n.device_id,
          is_frozen: n.is_frozen
        }
      })),
      ...edges.map((e) => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          amount: e.amount,
          label: e.formatted_amount,
          utr_number: e.utr_number,
          speed_flag: e.speed_flag,
          is_suspicious_flow: e.is_suspicious_flow
        }
      }))
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#E2E8F0',
            'font-family': 'Inter, sans-serif',
            'font-size': '10px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'background-color': '#0F373E',
            'border-width': 2,
            'border-color': '#00F5D4',
            'width': 42,
            'height': 42,
            'transition-property': 'background-color, border-color, border-width, width, height',
            'transition-duration': 0.2
          }
        },
        // Role-based styling
        {
          selector: 'node[node_type = "victim"]',
          style: {
            'background-color': '#0284C7',
            'border-color': '#38BDF8',
            'border-width': 3,
            'shape': 'ellipse',
            'width': 48,
            'height': 48
          }
        },
        {
          selector: 'node[node_type = "mule_tier_1"]',
          style: {
            'background-color': '#C2410C',
            'border-color': '#FB923C',
            'border-width': 3,
            'shape': 'hexagon',
            'width': 50,
            'height': 50
          }
        },
        {
          selector: 'node[node_type = "mule_tier_2"]',
          style: {
            'background-color': '#7E22CE',
            'border-color': '#C084FC',
            'border-width': 2.5,
            'shape': 'diamond',
            'width': 46,
            'height': 46
          }
        },
        {
          selector: 'node[node_type = "mule_tier_3"]',
          style: {
            'background-color': '#991B1B',
            'border-color': '#F87171',
            'border-width': 3,
            'shape': 'round-rectangle',
            'width': 44,
            'height': 44
          }
        },
        {
          selector: 'node[node_type = "cashout"]',
          style: {
            'background-color': '#DC2626',
            'border-color': '#EF4444',
            'border-width': 4,
            'shape': 'triangle',
            'width': 50,
            'height': 50
          }
        },
        {
          selector: 'node[?is_frozen]',
          style: {
            'border-style': 'double',
            'border-width': 5,
            'border-color': '#38BDF8'
          }
        },
        // Selected / Highlighted Node
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#00F5D4',
            'width': 56,
            'height': 56
          }
        },
        // Edge styling
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': 'rgba(0, 245, 212, 0.4)',
            'target-arrow-color': 'rgba(0, 245, 212, 0.7)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'font-family': 'monospace',
            'color': '#00F5D4',
            'text-background-opacity': 0.85,
            'text-background-color': '#020909',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-color': 'rgba(0, 245, 212, 0.3)',
            'text-border-width': 1,
            'text-border-opacity': 0.7,
            'arrow-scale': 1.2
          }
        },
        // Suspicious / Rapid movement edge
        {
          selector: 'edge[?is_suspicious_flow]',
          style: {
            'width': 3.5,
            'line-color': '#EF4444',
            'target-arrow-color': '#EF4444',
            'color': '#FCA5A5',
            'text-border-color': '#EF4444',
            'line-style': 'dashed'
          }
        },
        // Highlighted neighbor edges
        {
          selector: 'edge.highlighted',
          style: {
            'width': 4,
            'line-color': '#00F5D4',
            'target-arrow-color': '#00F5D4',
            'z-index': 99
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 40,
        spacingFactor: 1.4,
        animate: true,
        animationDuration: 500
      }
    });

    // Node click handler
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData = node.data();

      // Clear previous edge highlights
      cy.edges().removeClass('highlighted');

      // Highlight connected incoming & outgoing edges
      node.connectedEdges().addClass('highlighted');

      if (onSelectNode) {
        onSelectNode({
          id: nodeData.id,
          label: nodeData.label,
          masked_account: nodeData.masked_account,
          bank_name: nodeData.bank_name,
          holder_name: nodeData.holder_name,
          risk_score: nodeData.risk_score,
          risk_category: nodeData.risk_category,
          node_type: nodeData.node_type,
          device_id: nodeData.device_id,
          is_frozen: nodeData.is_frozen
        });
      }
    });

    // Background click clears selection
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.edges().removeClass('highlighted');
        if (onSelectNode) {
          onSelectNode(null);
        }
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [nodes, edges]);

  // Handle external selectedNodeId change
  useEffect(() => {
    if (!cyRef.current) return;
    if (selectedNodeId) {
      const node = cyRef.current.$(`node#${selectedNodeId}`);
      if (node.length > 0) {
        cyRef.current.nodes().unselect();
        node.select();
        cyRef.current.edges().removeClass('highlighted');
        node.connectedEdges().addClass('highlighted');
      }
    }
  }, [selectedNodeId]);

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.25);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 30);
    }
  };

  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: 'breadthfirst',
        directed: true,
        padding: 40,
        spacingFactor: 1.4,
        animate: true
      }).run();
      cyRef.current.fit();
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-cyber-border/40 cyber-card">
      {/* Floating Canvas Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-[#020909]/80 backdrop-blur-md p-1 rounded-lg border border-cyber-border/40">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-cyber-primary/20 text-cyber-textLight hover:text-cyber-primary transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-cyber-primary/20 text-cyber-textLight hover:text-cyber-primary transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          title="Fit Viewport"
          className="p-1.5 rounded hover:bg-cyber-primary/20 text-cyber-textLight hover:text-cyber-primary transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset Layout"
          className="p-1.5 rounded hover:bg-cyber-primary/20 text-cyber-textLight hover:text-cyber-primary transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Network Legend */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center space-x-3 bg-[#020909]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyber-border/30 text-[10px]">
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" />
          <span className="text-gray-300">Victim</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded bg-[#FB923C] inline-block" />
          <span className="text-gray-300">Tier-1 Transit</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded rotate-45 bg-[#C084FC] inline-block" />
          <span className="text-gray-300">Tier-2 Layer</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded bg-[#EF4444] inline-block" />
          <span className="text-gray-300">Tier-3/Cashout</span>
        </div>
        <div className="flex items-center space-x-1 border-l border-gray-700 pl-2">
          <span className="w-3 h-0.5 bg-red-500 border-dashed inline-block" />
          <span className="text-red-400 font-mono">Rapid Transit</span>
        </div>
      </div>

      {/* Graph Canvas Container */}
      <div ref={containerRef} style={{ height }} className="w-full bg-[#020909]/95" />
    </div>
  );
};
