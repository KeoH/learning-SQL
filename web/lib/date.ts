export function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
        return 'hace unos segundos';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `hace ${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }

    if (days < 30) {
        const weeks = Math.floor(days / 7);
         return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    
    // Fallback to absolute date for older items
    return new Date(timestamp).toLocaleDateString('es-ES');
}
