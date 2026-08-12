import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../documentService';

export const useSearchDocuments = (params: Parameters<typeof documentService.searchDocuments>[0]) => {
    return useQuery({
        queryKey: ['documents', params],
        queryFn: () => documentService.searchDocuments(params),
    });
};

export const useDocumentMetadataEnums = () => {
    return useQuery({
        queryKey: ['documentEnums'],
        queryFn: documentService.getMetadataEnums,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useUploadDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (args: {
            file: { uri: string; type: string; name: string };
            category?: number;
            relatedEntityId?: string;
            relatedEntityType?: number;
            customFileName?: string;
        }) => documentService.uploadDocument(
            args.file,
            args.category,
            args.relatedEntityId,
            args.relatedEntityType,
            args.customFileName
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
};

export const useDeleteDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => documentService.deleteDocument(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
};
