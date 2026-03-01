export const FOOD_DATABASE = [
    // =========================
    // PROTEÍNAS
    // =========================
    { nome: "Peito de Frango Grelhado", kcal: 165, proteina: 31, gordura: 3.6, carboidrato: 0 },
    { nome: "Sobrecoxa de Frango Assada (sem pele)", kcal: 209, proteina: 26, gordura: 10.9, carboidrato: 0 },
    { nome: "Ovo de Galinha (1 unidade)", kcal: 78, proteina: 6, gordura: 5, carboidrato: 0.6, isUnit: true },
    { nome: "Clara de Ovo (1 unidade)", kcal: 17, proteina: 3.6, gordura: 0, carboidrato: 0.2, isUnit: true },
    { nome: "Carne Moída (Acém)", kcal: 212, proteina: 26, gordura: 11, carboidrato: 0 },
    { nome: "Carne Moída (Patinho)", kcal: 170, proteina: 28, gordura: 6, carboidrato: 0 },
    { nome: "Alcatra Grelhada", kcal: 219, proteina: 32, gordura: 9, carboidrato: 0 },
    { nome: "Contra-filé Grelhado", kcal: 271, proteina: 29, gordura: 17, carboidrato: 0 },
    { nome: "Tilápia Grelhada", kcal: 128, proteina: 26, gordura: 2.7, carboidrato: 0 },
    { nome: "Sardinha (Lata em água)", kcal: 208, proteina: 25, gordura: 11, carboidrato: 0 },
    { nome: "Atum (Lata em água)", kcal: 116, proteina: 26, gordura: 1, carboidrato: 0 },
    { nome: "Salmão Grelhado", kcal: 208, proteina: 20, gordura: 13, carboidrato: 0 },
    { nome: "Lombo Suíno Grelhado", kcal: 242, proteina: 27, gordura: 14, carboidrato: 0 },
    { nome: "Tofu", kcal: 76, proteina: 8, gordura: 4.8, carboidrato: 1.9 },
    { nome: "Lentilha Cozida", kcal: 116, proteina: 9, gordura: 0.4, carboidrato: 20 },
    { nome: "Grão-de-bico Cozido", kcal: 164, proteina: 9, gordura: 2.6, carboidrato: 27 },
    { nome: "Whey Protein (30g/1 dose)", kcal: 115, proteina: 23, gordura: 1.5, carboidrato: 3, isUnit: true, unitWeight: 30 },

    // =========================
    // CARBOIDRATOS
    // =========================
    { nome: "Arroz Branco Cozido", kcal: 130, proteina: 2.5, gordura: 0.3, carboidrato: 28 },
    { nome: "Arroz Integral Cozido", kcal: 111, proteina: 2.6, gordura: 0.9, carboidrato: 23 },
    { nome: "Feijão Carioca Cozido", kcal: 76, proteina: 4.8, gordura: 0.5, carboidrato: 13.6 },
    { nome: "Feijão Preto Cozido", kcal: 77, proteina: 4.5, gordura: 0.5, carboidrato: 14 },
    { nome: "Batata Inglesa Cozida", kcal: 86, proteina: 2, gordura: 0.1, carboidrato: 20 },
    { nome: "Batata Doce Cozida", kcal: 86, proteina: 1.6, gordura: 0.1, carboidrato: 20 },
    { nome: "Mandioca Cozida", kcal: 125, proteina: 1, gordura: 0.3, carboidrato: 30 },
    { nome: "Inhame Cozido", kcal: 118, proteina: 1.5, gordura: 0.2, carboidrato: 28 },
    { nome: "Macarrão Cozido", kcal: 158, proteina: 5.8, gordura: 0.9, carboidrato: 31 },
    { nome: "Macarrão Integral Cozido", kcal: 149, proteina: 6, gordura: 1.4, carboidrato: 30 },
    { nome: "Cuscuz de Milho Cozido", kcal: 112, proteina: 3.8, gordura: 0.7, carboidrato: 23 },
    { nome: "Pão Francês (1 unidade/50g)", kcal: 150, proteina: 4.7, gordura: 1.5, carboidrato: 29, isUnit: true, unitWeight: 50 },
    { nome: "Pão Integral (1 fatia)", kcal: 69, proteina: 3.6, gordura: 1.1, carboidrato: 12, isUnit: true, unitWeight: 25 },
    { nome: "Tapioca (100g)", kcal: 358, proteina: 0.2, gordura: 0, carboidrato: 88 },
    { nome: "Aveia em Flocos", kcal: 394, proteina: 14, gordura: 8.5, carboidrato: 66 },
    { nome: "Granola", kcal: 471, proteina: 10, gordura: 20, carboidrato: 64 },

    // =========================
    // FRUTAS
    // =========================
    { nome: "Banana Prata (1 unidade)", kcal: 89, proteina: 1.1, gordura: 0.3, carboidrato: 23, isUnit: true, unitWeight: 100 },
    { nome: "Maçã (1 unidade média)", kcal: 52, proteina: 0.3, gordura: 0.2, carboidrato: 14, isUnit: true, unitWeight: 150 },
    { nome: "Pera", kcal: 57, proteina: 0.4, gordura: 0.1, carboidrato: 15 },
    { nome: "Mamão", kcal: 43, proteina: 0.5, gordura: 0.3, carboidrato: 11 },
    { nome: "Manga", kcal: 60, proteina: 0.8, gordura: 0.4, carboidrato: 15 },
    { nome: "Abacaxi", kcal: 50, proteina: 0.5, gordura: 0.1, carboidrato: 13 },
    { nome: "Melancia", kcal: 30, proteina: 0.6, gordura: 0.2, carboidrato: 8 },
    { nome: "Morango", kcal: 32, proteina: 0.7, gordura: 0.3, carboidrato: 8 },
    { nome: "Abacate", kcal: 160, proteina: 2, gordura: 15, carboidrato: 9 },

    // =========================
    // GORDURAS E COMPLEMENTOS
    // =========================
    { nome: "Amendoim Torrado", kcal: 567, proteina: 26, gordura: 49, carboidrato: 16 },
    { nome: "Pasta de Amendoim", kcal: 588, proteina: 25, gordura: 50, carboidrato: 20 },
    { nome: "Castanha de Caju", kcal: 553, proteina: 18, gordura: 44, carboidrato: 30 },
    { nome: "Castanha do Pará", kcal: 659, proteina: 14, gordura: 67, carboidrato: 12 },
    { nome: "Chia", kcal: 486, proteina: 17, gordura: 31, carboidrato: 42 },
    { nome: "Linhaça", kcal: 534, proteina: 18, gordura: 42, carboidrato: 29 },
    { nome: "Azeite de Oliva (1 colher sopa)", kcal: 108, proteina: 0, gordura: 12, carboidrato: 0, isUnit: true, unitWeight: 15 },
    { nome: "Queijo Mussarela", kcal: 280, proteina: 22, gordura: 22, carboidrato: 2 },
    { nome: "Queijo Minas Frescal", kcal: 264, proteina: 17, gordura: 21, carboidrato: 3 },
    { nome: "Iogurte Natural Integral", kcal: 61, proteina: 3.5, gordura: 3.3, carboidrato: 4.7 },
    { nome: "Leite Integral", kcal: 61, proteina: 3.2, gordura: 3.3, carboidrato: 5 }
];
