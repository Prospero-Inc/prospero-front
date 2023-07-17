import { FC, PropsWithChildren } from 'react';
import Head from 'next/head';


interface Props {
    title: string;
    pageDescription: string;
    imageFullUrl?: string;
}

export const ProsperoLayout: FC<PropsWithChildren<Props>> = ({
    children,
    title,
    pageDescription,
    imageFullUrl,
}) => {
    return (
        <>
            <Head>
                <title>{title}</title>

                <meta name='description' content={pageDescription} />

                <meta name='og:title' content={title} />
                <meta name='og:description' content={pageDescription} />

                {imageFullUrl && <meta name='og:image' content={imageFullUrl} />}
            </Head>

            <nav>
                {/* <Navbar /> */}
            </nav>

            {/* <SideMenu /> */}

            <main
                style={{
                    margin: '80px auto',
                    maxWidth: '1440px',
                    padding: '30px',
                }}
            >
                {children}
            </main>

            {/* Footer */}
            <footer>{/* TODO: mi custom footer */}</footer>
        </>
    );
};