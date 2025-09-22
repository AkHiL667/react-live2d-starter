export class Live2dController {
	constructor(canvas, modelRef) {
		this.canvas = canvas;
		this.modelRef = modelRef;
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerLeave = this.onPointerLeave.bind(this);
	}

	attach() {
		if (!this.canvas) return;
		this.canvas.addEventListener('mousemove', this.onPointerMove, { passive: true });
		this.canvas.addEventListener('touchmove', this.onPointerMove, { passive: true });
		this.canvas.addEventListener('mouseleave', this.onPointerLeave, { passive: true });
		this.canvas.addEventListener('touchend', this.onPointerLeave, { passive: true });
	}

	detach() {
		if (!this.canvas) return;
		this.canvas.removeEventListener('mousemove', this.onPointerMove);
		this.canvas.removeEventListener('touchmove', this.onPointerMove);
		this.canvas.removeEventListener('mouseleave', this.onPointerLeave);
		this.canvas.removeEventListener('touchend', this.onPointerLeave);
	}

	onPointerMove(e) {
		const canvas = this.canvas;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const cx = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX;
		const cy = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY;
		if (cx == null || cy == null) return;

		const x = (cx - rect.left) / rect.width;
		const y = (cy - rect.top) / rect.height;
		const nx = x * 2 - 1;
		const ny = (1 - y) * 2 - 1;

		const model = this.modelRef.current;
		if (!model) return;

		if (typeof model.setPointer === 'function') {
			model.setPointer(nx, ny);
		} else if (typeof model.setDragging === 'function') {
			model.setDragging(nx, ny);
		}
	}

	onPointerLeave() {
		const model = this.modelRef.current;
		if (!model) return;
		if (typeof model.setPointer === 'function') {
			model.setPointer(0, 0);
		} else if (typeof model.setDragging === 'function') {
			model.setDragging(0, 0);
		}
	}
}
