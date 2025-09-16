import React, { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type { Employee } from "../../types";
import { createFuncionario } from "../../service/FuncionarioService";

interface EmployeeFormProps {
  initialData?: Employee | null;
  onSubmit: (data: Omit<Employee, "_id" | "createdAt">) => void;
  onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    nif: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome,
        sobrenome: initialData.sobrenome,
        nif: initialData.nif,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const novoFuncionario = await createFuncionario(formData);
      alert(`Funcionário ${novoFuncionario.nome} criado com sucesso!`);

      // 🔹 Chama o callback para o parent atualizar a lista
      onSubmit(formData);
    } catch (error: any) {
      alert(error.message || "Erro ao criar funcionário");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome *
          </label>
          <Input
            type="text"
            value={formData.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            placeholder="Nome do funcionário"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sobrenome *
          </label>
          <Input
            type="text"
            value={formData.sobrenome}
            onChange={(e) => handleChange("sobrenome", e.target.value)}
            placeholder="Sobrenome do funcionário"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NIF *
          </label>
          <Input
            type="text"
            value={formData.nif}
            onChange={(e) => handleChange("nif", e.target.value)}
            placeholder="NIF do funcionário"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Salvando..."
            : initialData
            ? "Salvar Alterações"
            : "Cadastrar Funcionário"}
        </Button>
      </div>
    </form>
  );
};
