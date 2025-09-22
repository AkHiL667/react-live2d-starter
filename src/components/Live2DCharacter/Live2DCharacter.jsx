import React, { useEffect, useRef, useState } from 'react';
import { loadLive2DModel } from './utils/live2dLoader.jsx';
import { Live2dController } from './utils/Live2dController.jsx';
import './Live2DCharacter.module.css';

const Live2DCharacter = ({ modelPath }) => {
    const canvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const animationFrameId = useRef();
    const loadedModelRef = useRef(null);
    const controllerRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error('Canvas element not found.');
            return;
        }

        const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
        if (!gl) {
            console.error('Failed to get WebGL context.');
            return;
        }

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);

        // Define the render loop function here
        const renderLoop = () => {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if (loadedModelRef.current) {
                loadedModelRef.current.updateAndDraw(gl);
            }

            animationFrameId.current = window.requestAnimationFrame(renderLoop);
        };

        (async () => {
            try {
                const model = await loadLive2DModel(gl, modelPath);
                loadedModelRef.current = model;

                controllerRef.current = new Live2dController(canvas, loadedModelRef);
                controllerRef.current.attach();

                setIsLoading(false);
                animationFrameId.current = window.requestAnimationFrame(renderLoop);
            } catch (e) {
                console.error('Failed to initialize Live2D model', e);
            }
        })();

        // Cleanup function
        return () => {
            window.removeEventListener('resize', resize);
            if (controllerRef.current) {
                controllerRef.current.detach();
            }
            if (animationFrameId.current) {
                window.cancelAnimationFrame(animationFrameId.current);
            }
            if (loadedModelRef.current) {
                loadedModelRef.current.release();
            }
        };
    }, [modelPath]);

    return (
        <div className="live2d-container">
            {isLoading && <div className="loading-overlay">Loading character...</div>}
            <canvas ref={canvasRef} id="live2d-canvas"></canvas>
        </div>
    );
};

export default Live2DCharacter;