# Goodbye onSuccess in useQuery (React Query v5) 
<img width="100%"  alt="image" src="https://github.com/user-attachments/assets/a550ef8b-8b33-442d-849e-e379c264e1a5" />

## Introduction  
In version 5 of **React Query**, the `onSuccess` option was removed from `useQuery`.  
The reason for this change was to prevent mixing UI logic with API and cache logic (**Violation of Separation of Concerns**).  


## Problems with onSuccess  
- Mixing UI logic with API and cache logic  
- Not being triggered in some cases (for example, when data comes from cache with `staleTime` set)  
- Being triggered multiple times when the same query is used in several components  
- Notifications being displayed repeatedly  
- Harder to test and maintain the code  
- Extra requests or repeated side-effects  
- Poor user experience and harder debugging  


## React Query Team Recommendation  
The React Query team recommends using the **Service Layer Pattern** and keeping layers separated:  

1. **Service Layer** → only network calls and data shaping  
2. **API Hook Layer** → only cache and state with `useQuery` (without UI side effects)  
3. **Page Hook Layer** → page-specific logic such as toast, redirect, or chain calls  
4. **UI Layer** → only rendering data  


## Code Example  

### Service Layer  
```ts
export async function fetchUsers() {
  const res = await fetch('/api/users');
  return res.json();
}
```

### API Hook Layer  
```ts
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from './service';

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers });
}
```

### Page Hook Layer  
```ts
import { useEffect } from 'react';
import { useUsers } from './useUsers';
import { toast } from 'react-hot-toast';

export function useUsersPage() {
  const q = useUsers();

  useEffect(() => {
    if (q.isSuccess) toast('Users loaded!');
  }, [q.isSuccess]);

  return q;
}
```

### UI Layer  
```tsx
import { useUsersPage } from './useUsersPage';

export function UsersPage() {
  const { data, isLoading } = useUsersPage();

  if (isLoading) return <>Loading...</>;
  return <ul>{data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```


## The Hidden Problem with isSuccess  
If you build a custom hook that’s used multiple times on the same page, each consumer of `isSuccess` can trigger the effect again.  
🔑 Solution: keep a marker in the React Query cache.  


## Preventing Duplicate Effects  

```ts
// useOnSuccessOnce.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const markKey = (id: string) => ['__once__', id];

export function useOnSuccessOnce({
  id,
  isSuccess,
  updatedAt,
  fn,
}: {
  id: string;
  isSuccess: boolean;
  updatedAt: number;
  fn?: () => void;
}) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!isSuccess || !updatedAt || !fn) return;
    const last = qc.getQueryData<number>(markKey(id));
    if (last === updatedAt) return; // already executed
    qc.setQueryData(markKey(id), updatedAt);
    fn();
  }, [id, isSuccess, updatedAt, fn, qc]);
}
```


## Usage  

```ts
// useCustomHook.ts
import { useQuery } from '@tanstack/react-query';
import { useOnSuccessOnce } from './useOnSuccessOnce';
import { toast } from 'react-hot-toast';

async function fetchUsers() {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export function useCustomHook() {
  const q = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  useOnSuccessOnce({
    id: 'users',
    isSuccess: q.isSuccess,
    updatedAt: q.dataUpdatedAt,
    fn: () => toast('Users loaded!'),
  });

  return q;
}
```


## Conclusion  
- `onSuccess` was removed in React Query v5.  
- Instead, separate logic into distinct layers (Service, API Hook, Page Hook, UI).  
- To prevent duplicate effects, use a **cache marker** or a helper hook like `useOnSuccessOnce`.  


## References and Code  
- **React Query v5 – Migration Guide**  
  https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5  

- **React Query v5 – useQuery API**  
  https://tanstack.com/query/v5/docs/framework/react/reference/useQuery  

- **GitHub Discussion: Why onSuccess/onError were removed**  
  https://github.com/TanStack/query/discussions/5175  


---
[⬅ Back to Notes](../README.md)