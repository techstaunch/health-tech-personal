import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function HomePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-[420px]">
                <CardHeader>
                    <CardTitle>Welcome to Health Tech</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Input placeholder="Your name" />
                    <Textarea placeholder="Message" />
                </CardContent>
            </Card>
        </div>
    );
}
