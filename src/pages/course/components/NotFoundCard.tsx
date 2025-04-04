
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NotFoundCard: React.FC = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>课程未找到</CardTitle>
          <CardDescription>
            请返回课程列表选择有效课程
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link to="/learning">
            <Button>返回课程列表</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotFoundCard;
