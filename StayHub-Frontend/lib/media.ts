const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getApiOrigin = () => {
    try {
        return new URL(API_BASE_URL).origin;
    }
    catch {
        return 'http://localhost:5000';
    }
};

export function resolveMediaUrl(value?: string | null) {
    if (!value) {
        return null;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return null;
    }

    if (trimmedValue.startsWith('data:') || trimmedValue.startsWith('blob:')) {
        return trimmedValue;
    }

    const apiOrigin = getApiOrigin();
    const toApiUrl = (pathname: string) => {
        const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
        try {
            return new URL(normalizedPath, apiOrigin).toString();
        }
        catch {
            return trimmedValue;
        }
    };

    try {
        const parsedUrl = new URL(trimmedValue);
        if (parsedUrl.pathname.startsWith('/uploads/')) {
            return toApiUrl(parsedUrl.pathname);
        }
        return parsedUrl.toString();
    }
    catch {
        if (trimmedValue.startsWith('/uploads/') || trimmedValue.startsWith('uploads/')) {
            return toApiUrl(trimmedValue);
        }
        return trimmedValue;
    }
}
