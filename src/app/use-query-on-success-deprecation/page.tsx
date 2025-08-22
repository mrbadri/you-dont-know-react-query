"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryEffect } from "./_hooks/use-query-effect";

// API call example
async function fetchUsers() {
  const res = await fetch("https://jsonplaceholder.typicode.com/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json() as Promise<{ id: number; name: string }[]>;
}

// A child component that also uses the same query
function UsersList({ label }: { label: string }) {
  const query = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  // ❌ naive effect — will run once PER COMPONENT
  useEffect(() => {
    if (query.isSuccess) {
      console.log(`❌ useEffect - Naive effect fired in ${label}`);
    }
  }, [query.isSuccess]);

  // ✅ Deduped effect — runs ONCE for the whole query
  useQueryEffect({
    id: "users-success",
    when: query.isSuccess,
    updatedAt: query.dataUpdatedAt,
    fn: () => {
      console.log("✅ useQueryEffect - Deduped effect fired once");
    },
  });

  return (
    <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
      <h2 className="text-lg font-medium text-white mb-3 flex items-center">
        <span className="mr-2">{label}</span>
        {query.isLoading && (
          <div className="animate-pulse text-white/50 text-sm">Loading...</div>
        )}
      </h2>

      {query.isError && (
        <div className="text-red-400 bg-red-400/10 rounded p-2 mb-3">
          Failed to load users
        </div>
      )}

      <ul className="space-y-2">
        {query.data?.map((user) => (
          <li
            key={user.id}
            className="text-white/90 hover:text-white transition-colors flex items-center p-2 rounded hover:bg-white/5"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3 text-sm">
              {user.name.charAt(0)}
            </div>
            {user.name}
          </li>
        ))}
      </ul>

      {query.data?.length === 0 && (
        <div className="text-white/50 text-center py-4">No users found</div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">
          React Query Effects Demo
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UsersList label="Component A" />
          <UsersList label="Component B" />
          <UsersList label="Component C" />
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
          <h2 className="text-lg font-medium text-white mb-2">
            About this demo
          </h2>
          <p className="text-white/70">
            This example demonstrates how React Query effects can be deduped
            across multiple components. Check the console to see the difference
            between naive effects and deduped effects.
          </p>
        </div>
      </div>
    </div>
  );
}
