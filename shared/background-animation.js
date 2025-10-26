/* ============================================= */
/* BACKGROUND ANIMATION SYSTEM                   */
/* ============================================= */
/* Creates a dynamic, flowing data stream effect */
/* on a <canvas> element.                        */
/* ============================================= */

class FlowingDataStreams {
    constructor(canvas) {
        if (!canvas) {
            console.error("Background animation canvas not found.");
            return;
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.time = 0;
        this.resize();
        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    init() {
        this.streams = Array.from({ length: 8 }, (_, i) => ({
            y: (i / 8) * this.canvas.height,
            offset: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.3,
            amplitude: 50 + Math.random() * 50,
            frequency: 0.002 + Math.random() * 0.001
        }));
        this.nodes = Array.from({ length: 30 }, () => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 1 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.4,
            pulseOffset: Math.random() * Math.PI * 2
        }));
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.time += 0.01;
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.03)';
        this.ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
        }
        this.streams.forEach(stream => {
            this.ctx.beginPath(); this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)'; this.ctx.lineWidth = 1.5;
            for (let x = 0; x < this.canvas.width; x += 5) {
                const y = stream.y + Math.sin(x * stream.frequency + this.time * stream.speed + stream.offset) * stream.amplitude;
                x === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();
            for (let i = 0; i < 3; i++) {
                const particleX = (this.time * 100 * stream.speed + i * 200) % this.canvas.width;
                const particleY = stream.y + Math.sin(particleX * stream.frequency + this.time * stream.speed + stream.offset) * stream.amplitude;
                this.ctx.fillStyle = 'rgba(0, 212, 255, 0.4)'; this.ctx.beginPath(); this.ctx.arc(particleX, particleY, 2, 0, Math.PI * 2); this.ctx.fill();
            }
        });
        this.nodes.forEach(node => {
            const pulse = Math.sin(this.time * 2 + node.pulseOffset) * 0.3 + 0.7;
            this.ctx.fillStyle = `rgba(255, 140, 66, ${node.opacity * pulse})`;
            this.ctx.beginPath(); this.ctx.arc(node.x, node.y, node.size * pulse, 0, Math.PI * 2); this.ctx.fill();
        });
        requestAnimationFrame(() => this.animate());
    }
}