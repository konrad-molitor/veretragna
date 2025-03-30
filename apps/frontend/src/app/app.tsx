import { Card, CardHeader, CardBody, CardFooter, Button, Divider } from '@heroui/react';

export function App() {
  const defaultContent =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full heroui-card" shadow="lg" radius="lg">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <h1 className="text-2xl font-bold text-center">
            Welcome to Frontend!
          </h1>
          <p className="text-red-500 text-center text-sm">
            This project is using Tailwind CSS v3.4 and HeroUI
          </p>
        </CardHeader>
        <Divider />
        <CardBody className="py-4">
          <p className="text-center text-gray-700">
            This project is using HeroUI!
          </p>
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-center pt-2">
          <Button color="primary" radius="full" variant="solid" className="heroui-button px-4 py-2">
            Get Started
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;
