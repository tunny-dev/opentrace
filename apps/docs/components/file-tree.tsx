"use client";

import * as React from "react";
import { Folder, FileCode, ChevronRight } from "lucide-react";

interface TreeNode {
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
  comment?: string;
}

export function FileTree({ data }: { data: TreeNode[] }) {
  return (
    <div className="my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-4 text-xs font-mono text-zinc-300">
      <TreeLevel nodes={data} depth={0} />
    </div>
  );
}

function TreeLevel({ nodes, depth }: { nodes: TreeNode[]; depth: number }) {
  return (
    <div className="space-y-1">
      {nodes.map((node, i) => (
        <div key={i} style={{ paddingLeft: `${depth * 16}px` }}>
          <div className="flex items-center gap-2 py-0.5">
            {node.type === "folder" ? (
              <>
                <ChevronRight className="size-3 text-zinc-500" />
                <Folder className="size-3.5 text-amber-400" />
                <span className="font-semibold text-zinc-200">{node.name}/</span>
              </>
            ) : (
              <>
                <span className="w-3" />
                <FileCode className="size-3.5 text-zinc-400" />
                <span className="text-zinc-300">{node.name}</span>
              </>
            )}
            {node.comment && (
              <span className="text-[11px] text-zinc-500 italic pl-2">// {node.comment}</span>
            )}
          </div>
          {node.children && <TreeLevel nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}
