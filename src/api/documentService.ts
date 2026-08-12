// Original documentService.ts content
import axiosClient from './axiosClient';

export interface DocumentMetadata {
    id: string; // The BaseModel returns id instead of entityId usually, but we need to check
    entityId: string;
    fileName: string;
    originalExtension: string;
    contentType: string;
    originalSizeBytes: number;
    compressedSizeBytes: number;
    createdBy: string;
    officeId: string;
    category: number;
    status: number;
    relatedEntityId?: string;
    relatedEntityType?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PagedList<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface DocumentSearchResponse extends PagedList<DocumentMetadata> {}

export interface DocumentEnumDto {
    id: number;
    name: string;
}

export interface DocumentMetadataEnumsDto {
    categories: DocumentEnumDto[];
    statuses: DocumentEnumDto[];
    entityTypes: DocumentEnumDto[];
}

export const documentService = {
    searchDocuments: async (params: {
        q?: string;
        page?: number;
        pageSize?: number;
        category?: number;
        status?: number;
        relatedEntityId?: string;
        relatedEntityType?: number;
    }): Promise<DocumentSearchResponse> => {
        const response = await axiosClient.get('/Documents', { params });
        return response.data;
    },

    uploadDocument: async (
        file: { uri: string; type: string; name: string },
        category?: number,
        relatedEntityId?: string,
        relatedEntityType?: number,
        customFileName?: string
    ): Promise<DocumentMetadata> => {
        const formData = new FormData();

        // React Native FormData requires file to have uri, type, and name
        formData.append('file', {
            uri: file.uri,
            type: file.type || 'application/octet-stream',
            name: file.name,
        } as any);

        if (category !== undefined) formData.append('category', category.toString());
        if (relatedEntityId) formData.append('relatedEntityId', relatedEntityId);
        if (relatedEntityType !== undefined) formData.append('relatedEntityType', relatedEntityType.toString());
        if (customFileName) formData.append('customFileName', customFileName);

        const response = await axiosClient.post('/Documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    deleteDocument: async (id: string): Promise<void> => {
        await axiosClient.delete(`/Documents/${id}`);
    },

    getMetadataEnums: async (): Promise<DocumentMetadataEnumsDto> => {
        const response = await axiosClient.get('/Documents/meta/enums');
        return response.data;
    },
};
