import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardContent } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { EmployeeForm } from "./EmployeeForm";
import {
  getFuncionarios,
  deleteFuncionario,
} from "../../service/FuncionarioService";
import type { Employee } from "../../types";
import { toast } from "react-toastify";

export const EmployeeList: React.FC = () => {
const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      const data = await getFuncionarios();
      setEmployees(data.serializes);
    } catch (error: any) {
      toast.error("Erro ao carregar funcionários");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (employeeId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      try {
        await deleteFuncionario(employeeId);
        toast.success("Funcionário excluído com sucesso!");
        fetchEmployees();
      } catch (error: any) {
        toast.error("Erro ao excluir funcionário");
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSave = async (newEmployeeId?: string) => {
    await fetchEmployees();
    if (newEmployeeId) {
      setHighlightedId(newEmployeeId);
      setTimeout(() => setHighlightedId(null), 3000); // remove destaque após 3s
    }
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.sobrenome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.nif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar funcionários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.length}
                </p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card
            key={employee._id}
            className={`hover:shadow-lg transition-shadow ${
              highlightedId === employee._id ? "border-2 border-green-500" : ""
            }`}
          >
            <CardContent>
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(employee)}
                    className="p-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(employee._id)}
                    className="p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">
                  {employee.nome} {employee.sobrenome}
                </h3>
                <p className="text-sm text-gray-600">NIF: {employee.nif}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm
                  ? "Nenhum funcionário encontrado com os critérios de busca."
                  : "Nenhum funcionário cadastrado ainda."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}
      >
        <EmployeeForm
          initialData={editingEmployee}
          onCancel={handleCloseModal}
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
};
