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
        const token = await require('../utils/storage').getItem("saas_token");

        const params: Record<string, string> = {};
        if (category !== undefined) params['category'] = category.toString();
        if (relatedEntityId) params['relatedEntityId'] = relatedEntityId;
        if (relatedEntityType !== undefined) params['relatedEntityType'] = relatedEntityType.toString();
        if (customFileName) params['customFileName'] = customFileName;

        const formData = new FormData();

        formData.append('file', {
            uri: file.uri,
            type: file.type || 'application/octet-stream',
            name: file.name || 'upload.bin',
        } as any);

        if (category !== undefined) formData.append('category', category.toString());
        if (relatedEntityId) formData.append('relatedEntityId', relatedEntityId);
        if (relatedEntityType !== undefined) formData.append('relatedEntityType', relatedEntityType.toString());
        if (customFileName) formData.append('customFileName', customFileName);

        const response = await axiosClient.post('/Documents', formData, {
            // Delete Content-Type to allow React Native's XMLHttpRequest to auto-generate the multipart boundary
            transformRequest: [(data, headers) => {
                if (headers) {
                    delete headers['Content-Type'];
                    delete headers['content-type'];
                }
                return data;
            }]
        });

        return response.data;
    },

    uploadMultipleDocuments: async (
        files: { uri: string; type: string; name: string; mimeType?: string }[],
        category?: number,
        relatedEntityId?: string,
        relatedEntityType?: number
    ): Promise<void> => {
        if (!relatedEntityId || !files || files.length === 0) return;
        
        for (const file of files) {
            try {
                const actualType = file.mimeType || (file.type && file.type.includes('/') ? file.type : 'application/octet-stream');
                await documentService.uploadDocument(
                    { uri: file.uri, type: actualType, name: file.name },
                    category,
                    relatedEntityId,
                    relatedEntityType
                );
            } catch (uploadErr) {
                console.warn(`Failed to upload attachment ${file.name}`, uploadErr);
            }
        }
    },

    deleteDocument: async (id: string): Promise<void> => {
        await axiosClient.delete(`/Documents/${id}`);
    },

    getMetadataEnums: async (): Promise<DocumentMetadataEnumsDto> => {
        const response = await axiosClient.get('/Documents/meta/enums');
        return response.data;
    },
};
