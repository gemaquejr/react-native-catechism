type Intervalo = {
    inicioEmMinutos: number;
    fimEmMinutos: number;
};

export function horariosSeSobrepoem(a: Intervalo, b: Intervalo): boolean {
    return (
        a.inicioEmMinutos < b.fimEmMinutos &&
        b.inicioEmMinutos < a.fimEmMinutos
    );
}