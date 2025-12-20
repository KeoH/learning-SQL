import { ChatInterface } from '@/components/ChatInterface';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function SessionPage({ params }: PageProps) {
    const { id } = await params;
    return (
        <div className="h-full">
            <ChatInterface sessionId={id} />
        </div>
    );
}
