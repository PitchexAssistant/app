# Create Frontend Component

Follow this guide to create a new React component in the frontend.

## 1. Component Structure
Create a new file in `frontend/src/components/`.

```tsx
// frontend/src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  isActive?: boolean;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, isActive = false }) => {
  return (
    <div className={`p-4 rounded ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`}>
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
};
```

## 2. Styling
Use Tailwind CSS classes directly in the `className` prop.
For complex styles, consider extracting them to a separate CSS module or using `clsx`/`classnames` utility.

## 3. State Management
If the component needs global state, use the Context API or custom hooks.

```tsx
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();
  // ...
};
```

## 4. Export
Ensure the component is exported (named export preferred).

## 5. Usage
Import and use the component in a Page or another Component.

```tsx
import { MyComponent } from '../components/MyComponent';

const HomePage = () => {
  return <MyComponent title="Welcome" isActive={true} />;
};
```
