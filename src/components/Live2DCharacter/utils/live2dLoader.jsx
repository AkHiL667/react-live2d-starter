import { Live2DCubismFramework as L2D } from '../../../live2d/live2dcubismframework.ts';
import { CubismUserModel } from '../../../live2d/model/cubismusermodel.ts';
import { CubismRenderer_WebGL } from '../../../live2d/rendering/cubismrenderer_webgl.ts';
import { CubismEyeBlink } from '../../../live2d/effect/cubismeyeblink.ts';
import { CubismBreath, BreathParameterData } from '../../../live2d/effect/cubismbreath.ts';
import { csmVector } from '../../../live2d/type/csmvector.ts';
import { CubismDefaultParameterId as Param } from '../../../live2d/cubismdefaultparameterid.ts';

let frameworkStarted = false;

class SimpleUserModel extends CubismUserModel {
    constructor() {
        super();
        this._eyeBlink = null;
        this._breath = null;
        this._lastTimeMs = performance.now();
        this._t = 0;
        this._pointerX = 0;
        this._pointerY = 0;
    }

    setPointer(nx, ny) {
        this._pointerX = Math.max(-1, Math.min(1, nx || 0));
        this._pointerY = Math.max(-1, Math.min(1, ny || 0));
        this.setDragging(this._pointerX, this._pointerY);
    }

    async loadFromModel3(gl, model3Url) {
        const baseUrl = new URL(model3Url, window.location.origin);
        const model3 = await (await fetch(baseUrl.toString())).json();

        const moc3Url = new URL(model3.FileReferences.Moc, baseUrl).toString();
        const moc3Buffer = await (await fetch(moc3Url)).arrayBuffer();
        this.loadModel(moc3Buffer);

        // Physics if available
        if (model3.FileReferences.Physics) {
            const physicsUrl = new URL(model3.FileReferences.Physics, baseUrl).toString();
            const physicsBuffer = await (await fetch(physicsUrl)).arrayBuffer();
            this.loadPhysics(physicsBuffer, physicsBuffer.byteLength);
        }

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

        // EyeBlink setup
        const idm = L2D.CubismFramework.getIdManager();
        this._eyeBlink = CubismEyeBlink.create();
        const eyeParams = new csmVector();
        eyeParams.pushBack(idm.getId(Param.ParamEyeLOpen));
        eyeParams.pushBack(idm.getId(Param.ParamEyeROpen));
        this._eyeBlink.setParameterIds(eyeParams);
        this._eyeBlink.setBlinkingInterval(3.8);
        this._eyeBlink.setBlinkingSetting(0.08, 0.06, 0.12);

        // Breath setup
        this._breath = CubismBreath.create();
        const bp = new csmVector();
        bp.pushBack(new BreathParameterData(idm.getId(Param.ParamAngleX), 0.0, 10.0, 6.0, 0.5));
        bp.pushBack(new BreathParameterData(idm.getId(Param.ParamAngleY), 0.0, 8.0, 7.0, 0.5));
        bp.pushBack(new BreathParameterData(idm.getId(Param.ParamAngleZ), 0.0, 5.0, 8.0, 0.5));
        bp.pushBack(new BreathParameterData(idm.getId(Param.ParamBodyAngleX), 0.0, 4.0, 6.5, 0.8));
        bp.pushBack(new BreathParameterData(idm.getId(Param.ParamBodyAngleZ), 0.0, 3.0, 7.5, 0.8));
        this._breath.setParameters(bp);

        this.setInitialized(true);
        return this;
    }

    updateAndDraw(gl) {
        if (!this.isInitialized()) return;

        const now = performance.now();
        const dt = Math.min(0.033, Math.max(0, (now - this._lastTimeMs) / 1000));
        this._lastTimeMs = now;
        this._t += dt;

        const model = this.getModel();
        const idm = L2D.CubismFramework.getIdManager();

        // Idle sway
        const swayX = Math.sin(this._t * 0.8) * 5.0;
        const swayY = Math.sin(this._t * 0.6 + 1.0) * 3.5;
        const swayZ = Math.sin(this._t * 1.1 + 2.0) * 2.5;

        // Pointer influence
        const lookX = this._pointerX;
        const lookY = this._pointerY;
        const headGain = 20.0;
        const bodyGain = 5.0;
        const eyeGain = 0.6;

        // Head angles (blend idle + pointer)
        model.addParameterValueById(idm.getId(Param.ParamAngleX), swayX + lookX * headGain, 0.7);
        model.addParameterValueById(idm.getId(Param.ParamAngleY), swayY + lookY * headGain, 0.7);
        model.addParameterValueById(idm.getId(Param.ParamAngleZ), swayZ + lookX * -5.0, 0.7);

        // Body follow
        model.addParameterValueById(idm.getId(Param.ParamBodyAngleX), lookX * bodyGain, 0.5);
        model.addParameterValueById(idm.getId(Param.ParamBodyAngleZ), lookX * -bodyGain * 0.6, 0.5);

        // Eye tracking
        model.setParameterValueById(idm.getId(Param.ParamEyeBallX), lookX * eyeGain, 0.5);
        model.setParameterValueById(idm.getId(Param.ParamEyeBallY), -lookY * eyeGain, 0.5);

        // Procedural effects
        if (this._eyeBlink) this._eyeBlink.updateParameters(model, dt);
        if (this._breath) this._breath.updateParameters(model, dt);
        if (this._physics) this._physics.evaluate(model, dt);

        // Finalize & draw
        model.update();
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