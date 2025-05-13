
import BudgetManager from "@/components/BudgetManager";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold text-center mb-8 text-budget-dark">
          Sistema de Orçamento DRE
        </h1>
        <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
          Crie facilmente seu Demonstrativo de Resultados do Exercício com estrutura hierárquica. 
          Adicione itens, organize por categorias e arraste para reorganizar conforme necessário.
        </p>
        
        <BudgetManager />
      </div>
    </div>
  );
};

export default Index;
