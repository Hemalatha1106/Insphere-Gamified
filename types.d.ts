declare module 'react-to-print' {
    import * as React from 'react';

    export interface UseReactToPrintOptions {
        contentRef: React.MutableRefObject<any>;
        documentTitle?: string;
        onAfterPrint?: () => void;
        onBeforeGetContent?: () => void | Promise<any>;
        onBeforePrint?: () => void | Promise<any>;
        onPrintError?: (errorLocation: string, error: Error) => void;
        removeAfterPrint?: boolean;
        suppressErrors?: boolean;
        trigger?: () => React.ReactElement;
        nonce?: string;
        pageStyle?: string | (() => string);
        copyStyles?: boolean;
        bodyClass?: string;
    }

    export function useReactToPrint(options: UseReactToPrintOptions): () => void;
}
