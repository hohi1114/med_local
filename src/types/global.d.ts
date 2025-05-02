// src/types/global.d.ts

declare global {
  interface Error {
    status?: string;
    response?: {
      data?: {
        error?: string;
      };
    };
  }

  // This will declare CSS Modules to be treated as objects with class names as keys and strings as values.
  declare module "*.css" {
    const content: { [className: string]: string };
    export default content;
  }
}

// Ensure the file is treated as a module
export {};
