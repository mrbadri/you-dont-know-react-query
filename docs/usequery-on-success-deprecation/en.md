# Goodbye onSuccess in useQuery (React Query v5)

<img width="100%" alt="image" src="https://github.com/user-attachments/assets/a550ef8b-8b33-442d-849e-e379c264e1a5" />

## Introduction

In version 5 of **React Query**, the `onSuccess` option was removed from `useQuery`.  
The reason for this change was to prevent mixing UI logic with API and cache logic (**Violation of Separation of Concerns**).

## Problems with onSuccess

- Mixing UI logic with API/cache logic
- Not executing in some cases (e.g., when data is returned from cache and `staleTime` is active)
- Triggering multiple times when a query is used in multiple components
- Notifications being shown several times in a row
- Harder to test and maintain code
- Causing extra requests or repeated side-effects
- Poor user experience and harder debugging

## React Query Team Recommendation

The React Query team recommends using the **Service Layer Pattern** to keep responsibilities separate:

1. **Service Layer** → only network calls and data shaping
2. **API Hook Layer** → only cache and state with `useQuery` (no UI side effects)
3. **Page Hook Layer** → page-level logic such as toast, redirect, or chain calls
4. **UI Layer** → only rendering data

## Example Code

### Service Layer

```ts
export async function fetchUsers() {
  const res = await fetch("/api/users");
  return res.json();
}
```

### API Hook Layer

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "./service";

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: fetchUsers });
}
```

### Page Hook Layer

```ts
import { useEffect } from "react";
import { useUsers } from "./useUsers";

export function useUsersPage() {
  const q = useUsers();

  useEffect(() => {
    if (q.isSuccess) console.log("Users loaded!");
  }, [q.isSuccess]);

  return q;
}
```

### UI Layer

```tsx
import { useUsersPage } from "./useUsersPage";

export function UsersPage() {
  const { data, isLoading } = useUsersPage();

  if (isLoading) return <>Loading...</>;
  return (
    <ul>
      {data.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

## Hidden Problem with isSuccess

If you create a custom hook that is used multiple times on a page, each consumer of `isSuccess` can re-trigger the effect.  
🔑 Solution: use a marker in React Query’s cache.

## Preventing Duplicate Effects

```ts
// useQueryEffect.ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const markKey = (id: string) => ["__query-effect__", id];

export function useQueryEffect({
  id,
  when,
  updatedAt,
  fn,
}: {
  id: string;
  when: boolean;
  updatedAt: number;
  fn?: () => void;
}) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!when || !updatedAt || !fn) return;
    const last = qc.getQueryData<number>(markKey(id));
    if (last === updatedAt) return; // already executed
    qc.setQueryData(markKey(id), updatedAt);
    fn();
  }, [id, when, updatedAt, fn, qc]);
}
```

## Usage

```ts
// useUsersQuery.ts
import { useQuery } from "@tanstack/react-query";
import { useQueryEffect } from "./useQueryEffect";

async function fetchUsers() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export function useUsersQuery() {
  const q = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  // ✅ Run only once on success
  useQueryEffect({
    id: "users-success",
    when: q.isSuccess,
    updatedAt: q.dataUpdatedAt,
    fn: () => console.log("Users loaded!"),
  });

  // ✅ Run only once on error
  useQueryEffect({
    id: "users-error",
    when: q.isError,
    updatedAt: q.errorUpdatedAt,
    fn: () => console.error("Failed to load users!"),
  });

  return q;
}
```

📌 A practical example of using this hook is provided at:  
`src/app/use-query-on-success-deprecation/page.tsx`

## Summary

- `onSuccess` was removed in React Query v5.
- Instead, implement logic in separate layers (Service, API Hook, Page Hook, UI).
- To prevent duplicate effects, use a **cache marker** or a helper hook like `useQueryEffect`.

## References & Code

- **React Query v5 – Migration Guide**  
  https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5

- **React Query v5 – useQuery API**  
  https://tanstack.com/query/v5/docs/framework/react/reference/useQuery

- **GitHub Discussion: Why onSuccess/onError were removed**  
  https://github.com/TanStack/query/discussions/5175

---

[⬅ Back to Notes](../../README.md)
