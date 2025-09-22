import { Live2DCubismFramework as L2D } from '../../../live2d/live2dcubismframework.ts';
import { CubismUserModel } from '../../../live2d/model/cubismusermodel.ts';
import { CubismRenderer_WebGL } from '../../../live2d/rendering/cubismrenderer_webgl.ts';

let frameworkStarted = false;

class SimpleUserModel extends CubismUserModel {
    async loadFromModel3(gl, model3Url) {
        const baseUrl = new URL(model3Url, window.location.origin);
        const model3 = await (await fetch(baseUrl.toString())).json();

        const moc3Url = new URL(model3.FileReferences.Moc, baseUrl).toString();
        const moc3Buffer = await (await fetch(moc3Url)).arrayBuffer();
        this.loadModel(moc3Buffer);

        this.createRenderer();
        this.getRenderer().startUp(gl);
        this.getRenderer().setRenderState(null, [0, 0, gl.canvas.width, gl.canvas.height]);

        const textures = model3.FileReferences.Textures || [];
        await Promise.all(textures.map(async (texPath, idx) => {
            const url = new URL(texPath, baseUrl).toString();
            const image = await loadImage(url);
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
            this.getRenderer().bindTexture(idx, tex);
        }));

        // Basic model transform to fit view
        const modelMatrix = this.getModelMatrix();
        modelMatrix.setCenterPosition(0.0, 0.0);
        this.setInitialized(true);
        return this;
    }

    updateAndDraw(gl) {
        if (!this.isInitialized()) return;
        this.getRenderer().setRenderState(null, [0, 0, gl.canvas.width, gl.canvas.height]);
        this.getRenderer().drawModel();
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

export async function loadLive2DModel(gl, model3Url) {
    if (!frameworkStarted) {
        L2D.CubismFramework.startUp();
        L2D.CubismFramework.initialize();
        frameworkStarted = true;
    }
    const model = new SimpleUserModel();
    await model.loadFromModel3(gl, model3Url);
    return model;
}